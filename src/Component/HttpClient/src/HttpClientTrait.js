import { Readable, Writable } from 'stream';
import { stringify as qsStringify } from 'querystring';

const TransportException = Jymfony.Contracts.HttpClient.Exception.TransportException;

/**
 * Merges and encodes a query array with a query string.
 *
 * @param {null|string} queryString
 * @param {Object.<string, string>} queryArray
 * @param {boolean} replace
 *
 * @returns {null|string}
 *
 * @throws InvalidArgumentException When an invalid query-string value is passed
 */
const mergeQueryString = (queryString, queryArray, replace) => {
    if (! queryArray || 0 === Object.keys(queryArray).length) {
        return queryString;
    }

    const query = {};

    if (null !== queryString) {
        for (const v of queryString.split('&')) {
            if ('' === v) {
                continue;
            }

            const k = decodeURIComponent(v.split('=', 2)[0]);
            query[k] = (query[k] ? query[k] + '&' : '') + v;
        }
    }

    if (replace) {
        for (const [ k, v ] of __jymfony.getEntries(queryArray)) {
            if (null === v) {
                delete query[k];
            }
        }
    }

    queryString = qsStringify(queryArray);
    queryArray = {};

    if (queryString) {
        for (const v of queryString.split('&')) {
            queryArray[decodeURIComponent(v.split('=', 2)[0])] = v;
        }
    }

    return Object.values(replace ? Object.assign({}, query, queryArray) : Object.assign({}, queryArray, query)).join('&');
};

/**
 * @typedef ParsedUrl
 *
 * @property {string} scheme
 * @property {null|string} authority
 * @property {null|string} path
 * @property {null|string} query
 * @property {null|string} fragment
 */

/**
 * @typedef ResolvedProxy
 *
 * @property {string} url
 * @property {null|string} auth
 * @property {null|string[]} noProxy
 */

/**
 * @return Object.<string, string[]>
 *
 * @throws InvalidArgumentException When an invalid header is found
 */
const normalizeHeaders = headers => {
    const normalizedHeaders = {};
    const headersIsArray = isArray(headers);

    for (let [ name, values ] of __jymfony.getEntries(headers)) {
        values = isObject(values) ? String(values) : values;

        if (headersIsArray) {
            if (! isString(values)) {
                throw new InvalidArgumentException(__jymfony.sprintf('Invalid value for header "%s": expected string, "%s" given.', name, __jymfony.get_debug_type(values)));
            }

            const m = values.match(/^(.+):(.+)$/);
            name = m[1];
            values = [ __jymfony.ltrim(m[2]) ];
        } else {
            if (isObject(values)) {
                throw new InvalidArgumentException(__jymfony.sprintf('Invalid value for header "%s": expected string, "%s" given.', name, __jymfony.get_debug_type(values)));
            }

            values = isArray(values) ? values : [ values ];
        }

        const lcName = name.toLowerCase();
        normalizedHeaders[lcName] = [];

        for (let value of values) {
            normalizedHeaders[lcName].push(value = name + ': ' + value);

            if (value.match(/^[\r\n\x00]+$/)) {
                throw new InvalidArgumentException(__jymfony.sprintf('Invalid header: CR/LF/NUL found in "%s".', value));
            }
        }
    }

    return normalizedHeaders;
};

const empty = v => ! v || (isArray(v) && 0 === v.length) || (isObjectLiteral(v) && 0 === Object.keys(v).length);

/**
 * @throws {InvalidArgumentException} When an invalid option is found
 */
const mergeDefaultOptions = (options, defaultOptions, allowExtraOptions = false) => {
    options.normalized_headers = normalizeHeaders(options.headers || []);

    if (defaultOptions.headers) {
        Object.assign(options.normalized_headers, normalizeHeaders(defaultOptions.headers));
    }

    options.headers = [];
    for (const values of Object.values(options.normalized_headers)) {
        options.headers.push(...values);
    }

    let resolve = options.resolve;
    if (resolve) {
        options.resolve = {};
        for (const [ k, v ] of __jymfony.getEntries(resolve)) {
            options.resolve[HttpClientTrait._parseUrl('http://' + k).authority.substr(2)] = String(v);
        }
    }

    // Option "query" is never inherited from defaults
    options.query = options.query || {};

    for (const [ k, v ] of __jymfony.getEntries(defaultOptions)) {
        if ('normalized_headers' !== k && 'headers' !== k && empty(options[k])) {
            options[k] = v;
        }
    }

    if ((resolve = defaultOptions.resolve)) {
        for (const [ k, v ] of __jymfony.getEntries(resolve)) {
            if (! options.resolve) {
                options.resolve = {};
            }

            const auth = HttpClientTrait._parseUrl('http://' + k).authority.substr(2);
            if (options.resolve[auth]) {
                continue;
            }

            options.resolve[auth] = String(v);
        }
    }

    if (allowExtraOptions || 0 === Object.keys(defaultOptions).length) {
        return options;
    }

    // Look for unsupported options
    for (const name of Object.keys(options)) {
        if (name in defaultOptions || 'normalized_headers' === name) {
            continue;
        }

        // If ('auth_ntlm' === name) {
        //     If (!\extension_loaded('curl')) {
        //         $msg = 'try installing the "curl" extension to use "%s" instead.';
        //     } else {
        //         $msg = 'try using "%s" instead.';
        //     }
        //
        //     Throw new InvalidArgumentException(sprintf('Option "auth_ntlm" is not supported by "%s", '.$msg, __CLASS__, CurlHttpClient::class));
        // }

        const alternatives = [];

        for (const key of Object.keys(defaultOptions)) {
            if (__jymfony.levenshtein(name, key) <= name.length / 3 || key.includes(name)) {
                alternatives.push(key);
            }
        }

        throw new InvalidArgumentException(__jymfony.sprintf('Unsupported option "%s" passed to "%s", did you mean "%s"?', name, __jymfony.get_debug_type(this), (alternatives.length ? alternatives : Object.keys(defaultOptions)).join('", "')));
    }

    return options;
};

/**
 * @param {Object.<string, string>|string|NodeJS.ReadableStream|Buffer|Function} body
 *
 * @returns {NodeJS.ReadableStream}
 *
 * @throws InvalidArgumentException When an invalid body is passed
 */
const normalizeBody = body => {
    if (isFunction(body)) {
        body = body();
    }

    if (isObjectLiteral(body)) {
        body = qsStringify(body);
    }

    if (isString(body)) {
        body = new __jymfony.StreamBuffer(Buffer.from(body, 'utf-8'));
    } else if (isBuffer(body)) {
        body = new __jymfony.StreamBuffer(body);
    }

    if (! (body instanceof Readable)) {
        throw new InvalidArgumentException(__jymfony.sprintf('Option "body" must be string, buffer, readable stream or callable, "%s" given.', __jymfony.get_debug_type(body)));
    }

    return body;
};

/**
 * Provides the common logic from writing HttpClientInterface implementations.
 *
 * All methods are static to prevent implementers from creating memory leaks via circular references.
 *
 * @memberOf Jymfony.Component.HttpClient
 */
class HttpClientTrait {
    /**
     * Validates and normalizes method, URL and options, and merges them with defaults.
     *
     * @param {string|null} method
     * @param {string|null} url
     * @param {Object.<string, any>} options
     * @param {Object.<string, any>} [defaultOptions = {}]
     * @param {boolean} [allowExtraOptions = false]
     *
     * @returns [URL, Object.<string, *>]
     *
     * @throws {InvalidArgumentException} When a not-supported option is found
     *
     * @private
     */
    _prepareRequest(method, url, options, defaultOptions = {}, allowExtraOptions = false) {
        if (null !== method) {
            if (! method.match(/^[A-Z]+$/)) {
                throw new InvalidArgumentException(__jymfony.sprintf('Invalid HTTP method "%s", only uppercase letters are accepted.', method));
            }

            if (! method) {
                throw new InvalidArgumentException('The HTTP method can not be empty.');
            }
        }

        options = mergeDefaultOptions(options, defaultOptions, allowExtraOptions);

        const buffer = null === options.buffer || undefined === options.buffer ? true : options.buffer;
        if (isFunction(buffer)) {
            options.buffer = headers => {
                const res = buffer(headers);
                if (! isBoolean(res) && ! (res instanceof Writable)) {
                    throw new LogicException(__jymfony.sprintf('The function passed as option "buffer" must return boolean or a writable stream, got "%s".', __jymfony.get_debug_type(res)));
                }

                return res;
            };
        } else if (! isBoolean(buffer) && ! (buffer instanceof Writable)) {
            throw new InvalidArgumentException(__jymfony.sprintf('Option "buffer" must be boolean, writable stream resource or function, "%s" given.', __jymfony.get_debug_type(buffer)));
        }

        if (!! options.json) {
            if (!! options.body && '' !== options.body) {
                throw new InvalidArgumentException('Define either the "json" or the "body" option, setting both is not supported.');
            }

            options.body = JSON.stringify(options.json);
            delete options.json;

            if (! options.normalized_headers['content-type']) {
                const hdr = 'Content-Type: application/json';

                options.headers.push(hdr);
                options.normalized_headers['content-type'] = [ hdr ];
            }
        }

        if (! options.normalized_headers.accept) {
            const hdr = 'Accept: */*';

            options.headers.push(hdr);
            options.normalized_headers.accept = [ hdr ];
        }

        if (options.body) {
            options.body = normalizeBody(options.body);

            if (! options.normalized_headers['content-length'] && options.body instanceof __jymfony.StreamBuffer) {
                const hdr = 'Content-Length: ' + options.body.buffer.length;
                options.headers.push(hdr);
                options.normalized_headers['content-length'] = [ hdr ];
            }

            if (! options.normalized_headers['content-type']) {
                const hdr = 'Content-Type: application/octet-stream';
                options.headers.push(hdr);
                options.normalized_headers['content-type'] = [ hdr ];
            }
        }

        // Validate on_progress
        const onProgress = options.on_progress || console.log;
        if (! isFunction(onProgress)) {
            throw new InvalidArgumentException(__jymfony.sprintf('Option "on_progress" must be callable, "%s" given.', __jymfony.get_debug_type(onProgress)));
        }

        if (isArray(options.auth_basic)) {
            const count = options.auth_basic.length;
            if (0 >= count || 2 < count) {
                throw new InvalidArgumentException(__jymfony.sprintf('Option "auth_basic" must contain 1 or 2 elements, "%d" given.', count));
            }

            options.auth_basic = options.basic_auth.join(':');
        }

        if (! isString(options.auth_basic || '')) {
            throw new InvalidArgumentException(__jymfony.sprintf('Option "auth_basic" must be string or an array, "%s" given.', __jymfony.get_debug_type(options.auth_basic)));
        }

        if (options.auth_bearer) {
            if (! isString(options.auth_bearer)) {
                throw new InvalidArgumentException(__jymfony.sprintf('Option "auth_bearer" must be a string, "%s" given.', __jymfony.get_debug_type(options.auth_bearer)));
            }
            if (options.auth_bearer.match(/[^\x21-\x7E]/)) {
                throw new InvalidArgumentException('Invalid character found in option "auth_bearer": ' + JSON.stringify(options.auth_bearer) + '.');
            }
        }

        if (options.auth_basic && options.auth_bearer) {
            throw new InvalidArgumentException('Define either the "auth_basic" or the "auth_bearer" option, setting both is not supported.');
        }

        if (null !== url) {
            // Merge auth with headers
            if (options.auth_basic && ! options.normalized_headers.authorization) {
                const hdr = 'Authorization: Basic ' + Buffer.from(options.auth_basic).toString('base64');

                options.headers.push(hdr);
                options.normalized_headers.authorization = hdr;
            }

            // Merge bearer with headers
            if (options.auth_bearer && ! options.normalized_headers.authorization) {
                const hdr = 'Authorization: Bearer ' + options.auth_bearer;

                options.headers.push(hdr);
                options.normalized_headers.authorization = hdr;
            }

            delete options.auth_basic;
            delete options.auth_bearer;

            // Parse base URI
            if (isString(options.base_uri)) {
                options.base_uri = HttpClientTrait._parseUrl(options.base_uri);
            }

            // Validate and resolve URL
            const parsedUrl = HttpClientTrait._parseUrl(url, options.query);
            url = HttpClientTrait._resolveUrl(parsedUrl, options.base_uri, defaultOptions.query || {}).href;
        }

        // Finalize normalization of options
        options.http_version = String(options.http_version || '') || null;
        options.timeout = null === options.timeout || undefined === options.timeout ? 60 : options.timeout;
        options.max_duration = null !== options.max_duration && undefined !== options.max_duration ?
            (isString(options.max_duration) ? Number.parseFloat(options.max_duration) : options.max_duration) : 0;

        return [ url, options ];
    }

    static _shouldBuffer(headers) {
        /** @type {string|null} */
        let contentType = (headers['content-type'] || [])[0] || null;
        if (null === contentType) {
            return false;
        }

        if (! contentType.includes(';')) {
            contentType = contentType.substr(0, contentType.indexOf(';'));
        }

        return contentType && contentType.match(/^(?:text\/|application\/(?:.+\+)?(?:json|xml)$)/i);
    }

    /**
     * Parses a URL and fixes its encoding if needed.
     *
     * @param {string} url
     * @param {Object.<string, string>} query
     * @param {Object.<string, int>} allowedSchemes
     *
     * @returns {ParsedUrl}
     *
     * @throws InvalidArgumentException When an invalid URL is passed
     */
    static _parseUrl(url, query = {}, allowedSchemes = { http: 80, https: 443 }) {
        const domainRegex = '^(' + Object.keys(allowedSchemes).join('|') + ')://([^/]+)';
        url = url.replace(domainRegex, (_, protocol, domain) => {
            return protocol + '://' + __jymfony.punycode_to_ascii(domain);
        });

        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (e) {
            throw new InvalidArgumentException(__jymfony.sprintf('Malformed URL "%s".', url), 0, e);
        }

        if (Object.keys(query).length) {
            parsedUrl.query = mergeQueryString(parsedUrl.query || null, query, true);
        }

        let port = parsedUrl.port || 0;
        let scheme = parsedUrl.protocol || null;

        if (null !== scheme) {
            scheme = scheme.substr(0, parsedUrl.protocol.length - 1).toLowerCase();
            if (! allowedSchemes[scheme]) {
                throw new InvalidArgumentException(__jymfony.sprintf('Unsupported scheme in "%s".', url));
            }

            port = allowedSchemes[scheme] === port ? 0 : port;
        }

        let host = parsedUrl.host;
        if (host) {
            host += port ? ':' + port : '';
        }

        for (const part of [ 'username', 'password', 'pathname', 'search', 'hash' ]) {
            if (! parsedUrl[part]) {
                continue;
            }

            if (parsedUrl[part].includes('%')) {
                // https://tools.ietf.org/html/rfc3986#section-2.3
                parsedUrl[part] = parsedUrl[part].replace(/%(?:2[DE]|3[0-9]|[46][1-9A-F]|5F|[57][0-9A]|7E)+/i, m => decodeURIComponent(m));
            }

            // https://tools.ietf.org/html/rfc3986#section-3.3
            parsedUrl[part] = parsedUrl[part].replace(/[^-A-Za-z0-9._~!$&\/'()*+,;=:@%]+/, m => encodeURIComponent(m));
        }

        return {
            scheme,
            authority: !!host ? '//' + (parsedUrl.username ? parsedUrl.username + (parsedUrl.password ? ':' + parsedUrl.password : '') + '@' : '') + host : null,
            path: parsedUrl.pathname || null,
            query: parsedUrl.search || null,
            fragment: parsedUrl.hash || null,
        };
    }

    /**
     * @param {ParsedUrl} url
     * @param {string} baseUrl
     * @param {Object.<string, string>} queryDefaults
     *
     * @returns {URL}
     *
     * @private
     */
    static _resolveUrl(url, baseUrl, queryDefaults = {}) {
        return new URL(
            (url.scheme ? url.scheme + ':' : '') +
                (url.authority || '') +
                (url.path || '') +
                mergeQueryString(url.query || '', queryDefaults, false) +
                (url.fragment || ''),
            baseUrl || undefined
        );
    }

    /**
     * Loads proxy configuration from the same environment variables as curl when no proxy is explicitly set.
     *
     * @param {null|string|URL} proxy
     * @param {URL} url
     * @param {null|string} noProxy
     *
     * @returns {null|ResolvedProxy}
     *
     * @private
     */
    _getProxy(proxy, url, noProxy) {
        if (null === proxy || undefined === proxy) {
            proxy = process.env.HTTP_PROXY || process.env.ALL_PROXY || null;

            if ('https:' === url.protocol) {
                proxy = process.env.HTTPS_PROXY || proxy;
            }
        }

        if (null === proxy) {
            return null;
        }

        proxy = new URL(String(proxy), 'http://___');
        if ('___' === proxy.host) {
            throw new TransportException('Invalid HTTP proxy: host is missing.');
        }

        let proxyUrl;
        if ('http:' === proxy.protocol) {
            proxyUrl = 'tcp://' + proxy.host + ':' + (proxy.port || '80');
        } else if ('https:' === proxy.protocol) {
            proxyUrl = 'ssl://' + proxy.host + ':' + (proxy.port || '443');
        } else {
            throw new TransportException(__jymfony.sprintf('Unsupported proxy scheme "%s": "http:" or "https:" expected.', proxy.protocol));
        }

        noProxy = noProxy || process.env.NO_PROXY || '';

        return {
            url: proxyUrl,
            auth: proxy.username ? 'Basic ' + Buffer.from(decodeURIComponent(proxy.username) + ':' + decodeURIComponent(proxy.password || '')).toString('base64') : null,
            no_proxy: noProxy ? noProxy.split(/[\s,]+/g) : [],
        };
    }
}

export default getTrait(HttpClientTrait);
