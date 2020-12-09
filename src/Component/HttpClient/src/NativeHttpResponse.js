import { constants as HTTP2_CONSTANTS, connect as http2Connect } from 'http2';
import { PassThrough } from 'stream';
import { Socket } from 'net';
import { promises as fsPromises } from 'fs';
import { request as http1Request } from 'http';
import { performance } from 'perf_hooks';
import { pipeline } from 'stream';
import { connect as tlsConnect } from 'tls';
import zlib from 'zlib';

const CommonResponseTrait = Jymfony.Component.HttpClient.CommonResponseTrait;
const ResponseInterface = Jymfony.Contracts.HttpClient.ResponseInterface;
const TransportException = Jymfony.Contracts.HttpClient.Exception.TransportException;

const { readFile } = fsPromises;

const ENCODING_BROTLI = 'br';
const ENCODING_GZIP = 'gzip';
const ENCODING_DEFLATE = 'deflate';

/**
 * @memberOf Jymfony.Component.HttpClient
 */
export default class NativeHttpResponse extends implementationOf(ResponseInterface, CommonResponseTrait) {
    /**
     * Constructor.
     *
     * @param {URL} url
     * @param {Object.<string, *>} options
     * @param {Object.<string, *>} info
     * @param {Object.<string, *>} context
     * @param {function(): Promise<[function(): Promise<string>, URL]>} resolver
     * @param {function(dlNow: int, dlSize: int, info: *): void} onProgress
     */
    __construct(url, options, info, context, resolver, onProgress) {
        /**
         * @type {URL}
         *
         * @private
         */
        this._url = url;

        /**
         * @type {Object.<string, *>}
         *
         * @private
         */
        this._options = { ...options };

        /**
         * @type {Object.<string, *>}
         *
         * @private
         */
        this._context = context;

        /**
         * @type {Object<string, *>}
         *
         * @private
         */
        this._info = info;
        this._info.user_data = options.user_data;

        /**
         * @type {function(): Promise<[function(): Promise<null|string>, URL]>}
         *
         * @private
         */
        this._resolver = resolver;

        /**
         * @type {function(dlNow: int, dlSize: int, info: *): void}
         *
         * @private
         */
        this._onProgress = onProgress;

        /**
         * @type {Object<string, *>}
         *
         * @private
         */
        this._finalInfo = undefined;

        /**
         * @type {Object<string, string[]>}
         *
         * @private
         */
        this._headers = {};

        /**
         * @type {ReadableStream}
         *
         * @private
         */
        this._message = undefined;

        /**
         * @type {null|Buffer}
         *
         * @private
         */
        this._buffer = null;

        /**
         * @type {null|int}
         *
         * @private
         */
        this._remaining = null;

        /**
         * @type {AbortController|undefined}
         *
         * @private
         */
        this._abortController = 'undefined' !== typeof AbortController ? new AbortController() : undefined;

        /**
         * @returns {function(): boolean}
         *
         * @private
         */
        this._initializer = () => true;
    }

    /**
     * @inheritdoc
     */
    async getHeaders(Throw = true) {
        if (this._initializer) {
            await this._initialize();
        }

        if (Throw) {
            this._checkStatusCode();
        }

        return this._headers;
    }

    /**
     * @inheritdoc
     */
    cancel() {
        this.close();
    }

    /**
     * @inheritdoc
     */
    getInfo(type = undefined) {
        let info = this._finalInfo;
        if (! info) {
            info = { ...this._info };
            info.url = String(info.url);

            delete info.size_body;
            delete info.request_header;

            if (null === this._message) {
                this._finalInfo = info;
            }
        }

        return undefined !== type ? info[type] || null : info;
    }

    /**
     * @inheritdoc
     */
    async getContent(Throw = true) {
        if (this._initializer) {
            await this._initialize();
        }

        if (Throw) {
            this._checkStatusCode();
        }

        return this._buffer;
    }

    close() {
        if (this._abortController) {
            this._abortController.abort();
        }

        this._message = this._onProgress = null;
    }

    async _perform() {
        await this._open();
        if (! this._message) {
            return;
        }

        let contentStream;
        const contentEncoding = this._headers['content-encoding'] ? this._headers['content-encoding'][0] : undefined;

        switch (contentEncoding) {
            case ENCODING_DEFLATE:
                contentStream = zlib.createInflate();
                break;

            case ENCODING_GZIP:
                contentStream = zlib.createGunzip();
                break;

            case ENCODING_BROTLI:
                contentStream = zlib.createBrotliDecompress();
                break;

            default:
                contentStream = new PassThrough();
        }

        const stream = new __jymfony.StreamBuffer();
        await new Promise((resolve, reject) => {
            pipeline(this._message, contentStream, stream, err => {
                if (err) {
                    reject(err);
                }

                resolve();
            });
        });

        this._buffer = stream.buffer;
    }

    async _open() {
        const context = this._context;

        try {
            this._info.start_time = performance.now();
            let [ resolver, url ] = await this._resolver();

            while (true) {
                const currentIp = this._info.primary_ip;
                if (! currentIp) {
                    throw new TransportException(__jymfony.sprintf('Cannot reach host %s: unknown address', url.host));
                }

                const proxy = context.http.proxy || null;
                if (proxy) {
                    this._info.debug += '* Establish HTTP proxy tunnel to ' + proxy + '\n';
                    this._info.request_header = url.href;
                } else {
                    this._info.debug += '*   Trying ' + this._info.primary_ip + '...\n';
                    this._info.request_header = url.pathname + (url.query || '');
                }

                this._info.request_header = __jymfony.sprintf('> %s %s HTTP/%s\r\n', context.http.method, this._info.request_header, context.http.protocol_version);
                this._info.request_header += context.http.headers.join('\r\n') + '\r\n\r\n';

                const socket = new Socket();
                let stream = socket;
                try {
                    await new Promise((resolve, reject) => {
                        socket.on('error', reject);
                        socket.on('connect', resolve);

                        let localAddress, localPort;
                        const match = context.socket.bind_to.match(/^(.*):(\d+)$/);
                        if (match) {
                            [ , localAddress, localPort ] = match;
                            localAddress = '0' === localAddress ? undefined : localAddress;
                            localPort = '0' === localPort ? undefined : localPort;
                        }

                        socket.connect({
                            host: currentIp,
                            port: this._info.primary_port,
                            localAddress,
                            localPort: localPort ? ~~localPort : localPort,
                        });

                        socket.setNoDelay(context.socket.tcp_nodelay);
                    });
                } catch (e) {
                    context.ips.shift();
                    if (0 === context.ips.length) {
                        throw e;
                    }

                    this._info.primary_ip = context.ips[0];
                    continue;
                }

                if ('https:' === url.protocol) {
                    const alpnProtocols = [ 'http/1.1', 'http/1.0' ];
                    if ('2' === context.http.protocol_version) {
                        alpnProtocols.unshift('h2');
                    }

                    const ca = isString(context.ssl.ca) ? await readFile(context.ssl.ca) : context.ssl.ca;
                    const cert = isString(context.ssl.cert) ? await readFile(context.ssl.cert) : context.ssl.cert;
                    const key = isString(context.ssl.private_key) ? await readFile(context.ssl.private_key) : context.ssl.private_key;
                    const passphrase = isString(context.ssl.passphrase) ? await readFile(context.ssl.passphrase) : context.ssl.passphrase;

                    stream = await new Promise((resolve, reject) => {
                        const tlsSocket = tlsConnect({
                            socket,
                            ALPNProtocols: alpnProtocols,
                            servername: url.host,
                            ca,
                            cert,
                            key,
                            passphrase,
                            ciphers: context.ssl.ciphers,
                        }, () => resolve(tlsSocket));

                        tlsSocket.on('tlsClientError', reject);
                        tlsSocket.on('error', reject);
                    });

                    if ('h2' === stream.alpnProtocol) {
                        context.http.protocol_version = '2';
                    } else {
                        context.http.protocol_version = '1.1';
                    }
                }

                const headers = context.http.headers.reduce((cur, hdr) => {
                    const idx = hdr.indexOf(':');
                    if (-1 === idx) {
                        return cur;
                    }

                    const name = hdr.substr(0, idx);
                    cur[name] = __jymfony.trim(hdr.substr(idx + 1));

                    return cur;
                }, {});

                if ('2' === context.http.protocol_version) {
                    const client = http2Connect(url, {
                        createConnection: () => stream,
                    });

                    const [ http2Stream, responseHeaders ] = await new Promise((resolve, reject) => {
                        const h2Headers = Object.keys(headers)
                            .reduce((cur, idx) => {
                                if (idx.match(/^host$/i)) {
                                    return cur;
                                }

                                cur[idx] = headers[idx];
                                return cur;
                            }, {});

                        const stream = client.request({
                            [HTTP2_CONSTANTS.HTTP2_HEADER_METHOD]: context.http.method,
                            [HTTP2_CONSTANTS.HTTP2_HEADER_PATH]: url.pathname,
                            [HTTP2_CONSTANTS.HTTP2_HEADER_SCHEME]: url.protocol.substr(0, url.protocol.length - 1),
                            [HTTP2_CONSTANTS.HTTP2_HEADER_AUTHORITY]: url.origin.substr(url.protocol.length + 2),
                            ...h2Headers,
                        });

                        stream.on('response', headers => resolve([ stream, headers ]));
                        stream.on('error', reject);
                        if (context.http.content) {
                            stream.write(context.http.content);
                        }

                        stream.end();
                    });

                    this._message = http2Stream;
                    this._addHttp2ResponseHeaders(responseHeaders);
                } else {
                    this._message = await new Promise((resolve, reject) => {
                        const req = http1Request({
                            createConnection: () => stream,
                            url,
                            method: context.http.method,
                            headers,
                            timeout: context.http.timeout * 1000,
                            signal: this._abortController ? this._abortController.signal : undefined,
                        }, resolve);

                        req.on('error', reject);
                        if (context.http.content) {
                            req.write(context.http.content);
                        }

                        req.end();
                    });

                    this._addHttp1ResponseHeaders();
                }

                const location = this._headers.location ? this._headers.location[0] : null;
                url = await resolver(location, context);

                socket.end();

                if (null === url) {
                    this._headers = __jymfony.deepClone(this._info.response_headers);
                    break;
                }

                this._info.debug += __jymfony.sprintf('\nRedirecting: "%s %s"', this._info.http_code, url || this._url);
            }
        } catch (e) {
            await this.close();
            return;
        } finally {
            this._info.pretransfer_time = this._info.total_time = performance.now() - this._info.start_time;
        }

        this._context = this._resolver = null;

        if (undefined !== this._headers['content-length']) {
            this._remaining = ~~this._headers['content-length'][0];
        } else {
            this._remaining = -1;
        }

        if ('HEAD' === context.http.method || [ 204, 304 ].includes(this._info.http_code)) {
            return;
        }

        if (this._onProgress) {
            this._onProgress(0, this._remaining, this._info);
        }
    }

    /**
     * Adds status code and headers to this response from http1 incoming message.
     *
     * @private
     */
    _addHttp1ResponseHeaders() {
        const message = this._message;
        const info = this._info;

        info.response_headers = {};
        for (const [ key, value ] of __jymfony.getEntries(message.headers)) {
            info.response_headers[key] = isArray(value) ? value : [ value ];
        }

        info.status_code = message.statusCode;
        info.debug += __jymfony.sprintf('< HTTP/%s %u %s \r\n', message.httpVersion, message.statusCode, message.statusText);
        info.debug += '< \r\n';

        if (! info.status_code) {
            throw new TransportException(__jymfony.sprintf('Invalid or missing HTTP status line for "%s".', info.url));
        }
    }

    /**
     * Adds status code and headers to this response from http2 headers.
     *
     * @param {Object.<string, *>} headers
     *
     * @private
     */
    _addHttp2ResponseHeaders(headers) {
        const info = this._info;
        info.response_headers = {};
        for (const [ key, value ] of __jymfony.getEntries(headers)) {
            if (key.startsWith(':')) {
                continue;
            }

            info.response_headers[key] = isArray(value) ? value : [ value ];
        }

        info.status_code = headers[HTTP2_CONSTANTS.HTTP2_HEADER_STATUS];
        info.debug += __jymfony.sprintf('< HTTP/2 %u\r\n', info.status_code);
        info.debug += '< \r\n';

        if (! info.status_code) {
            throw new TransportException(__jymfony.sprintf('Invalid or missing HTTP status code for "%s".', info.url));
        }
    }
}
