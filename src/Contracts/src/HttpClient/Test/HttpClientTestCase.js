import { expect } from 'chai';

const TestCase = Jymfony.Component.Testing.Framework.TestCase;
const TestHttpServer = Jymfony.Contracts.HttpClient.Test.TestHttpServer;
const TransportException = Jymfony.Contracts.HttpClient.Exception.TransportException;

/**
 * A reference test suite for HttpClientInterface implementations.
 *
 * @memberOf Jymfony.Contracts.HttpClient.Test
 * @abstract
 */
export default class HttpClientTestCase extends TestCase {
    async before() {
        __self.server = await TestHttpServer.start();
    }

    async after() {
        await __self.server;
    }

    get defaultTimeout() {
        return 20000;
    }

    /**
     * @returns {Jymfony.Contracts.HttpClient.HttpClientInterface}
     * @abstract
     */
    getHttpClient() { }

    async testGetRequest() {
        const client = this.getHttpClient();
        const data = {}, response = client.request('GET', 'http://localhost:8057', {
            headers: { Foo: 'baR' },
            user_data: data,
        });

        expect(await response.getInfo('response_headers')).to.be.deep.equal({});
        expect(await response.getInfo()['user_data']).to.be.equal(data);
        expect(await response.getStatusCode()).to.be.equal(200);

        const info = response.getInfo();
        expect(info.error).to.be.equal(null);
        expect(info.redirect_count).to.be.equal(0);
        expect(info.response_headers.host[0]).to.be.equal('localhost:8057');
        expect(info.url).to.be.equal('http://localhost:8057/');

        const headers = await response.getHeaders();

        expect(headers.host[0]).to.be.equal('localhost:8057');
        expect(headers['content-type']).to.be.deep.equal([ 'application/json' ]);

        const body = JSON.parse((await response.getContent()).toString());
        expect(await response.getDecodedContent()).to.be.deep.equal(body);

        expect(body.server.SERVER_PROTOCOL).to.be.equal('HTTP/1.1');
        expect(body.uri).to.be.equal('http://localhost:8057/');
        expect(body.server.REQUEST_METHOD).to.be.equal('GET');
        expect(body.headers.host[0]).to.be.equal('localhost:8057');
        expect(body.headers.foo[0]).to.be.equal('baR');

        const broken = client.request('GET', 'http://localhost:8057/length-broken', {
            timeout: 1,
        });

        this.expectException(TransportException);
        await broken.getContent();
    }

    async testHeadRequest() {
        const client = this.getHttpClient();
        const data = {}, response = client.request('HEAD', 'http://localhost:8057/head', {
            headers: { Foo: 'baR' },
            user_data: data,
            buffer: false,
        });

        expect(response.getInfo('response_headers')).to.be.deep.equal({});
        expect(await response.getStatusCode()).to.be.equal(200);

        const info = response.getInfo();
        expect(info.response_headers.host[0]).to.be.equal('localhost:8057');

        const headers = await response.getHeaders();

        expect(headers.host[0]).to.be.equal('localhost:8057');
        expect(headers['content-type']).to.be.deep.equal([ 'application/json' ]);
        expect(~~headers['content-length'][0]).to.be.greaterThan(0);

        expect((await response.getContent()).toString()).to.be.equal('');
    }

    async testNonBufferedGetRequest() {
        const client = this.getHttpClient();
        const response = client.request('GET', 'http://localhost:8057/head', {
            headers: { Foo: 'baR' },
            buffer: false,
        });

        const body = await response.getDecodedContent();
        expect(body.headers.foo[0]).to.be.equal('baR');

        this.expectException(TransportException);
        await response.getContent();
    }

    async testBufferSink() {
        const sink = new __jymfony.StreamBuffer();
        const client = this.getHttpClient();
        const response = client.request('GET', 'http://localhost:8057', {
            headers: { Foo: 'baR' },
            buffer: sink,
        });

        await response.getContent();

        const body = JSON.parse(sink.buffer.toString());
        expect(body.headers.foo[0]).to.be.equal('baR');

        this.expectException(TransportException);
        await response.getDecodedContent();
    }

    async testConditionalBuffering() {
        const client = this.getHttpClient();
        let response = client.request('GET', 'http://localhost:8057');
        const firstContent = await response.getContent();
        const secondContent = await response.getContent();

        expect(firstContent).to.be.equal(secondContent);

        response = await client.request('GET', 'http://localhost:8057', {
            buffer: function () {
                return false;
            },
        });

        await response.getContent();

        this.expectException(TransportException);
        await response.getContent();
    }

    async testReentrantBufferCallback() {
        const client = this.getHttpClient();
        const response = client.request('GET', 'http://localhost:8057', {
            buffer: function () {
                response.cancel();
                return true;
            },
        });

        expect(await response.getStatusCode()).to.be.equal(200);

        this.expectException(TransportException);
        await response.getContent();
    }

    async testThrowingBufferCallback() {
        const client = this.getHttpClient();
        const response = client.request('GET', 'http://localhost:8057', {
            buffer: function () {
                throw new Exception('Boo.');
            },
        });

        this.expectException(TransportException);
        this.expectExceptionMessage('Boo.');

        await response.getContent();
    }

    async testUnsupportedOption() {
        const client = this.getHttpClient();

        this.expectException(InvalidArgumentException);
        client.request('GET', 'http://localhost:8057', {
            capture_peer_cert: 1.0,
        });
    }

    async testHttpVersion() {
        const client = this.getHttpClient();
        const response = client.request('GET', 'http://localhost:8057', {
            http_version: '1.0',
        });

        expect(await response.getStatusCode()).to.be.equal(200);

        const body = await response.getDecodedContent();
        expect(body.server.SERVER_PROTOCOL).to.be.equal('HTTP/1.0');
        expect(body.server.REQUEST_METHOD).to.be.equal('GET');
    }

    async testChunkedEncoding() {
        const client = this.getHttpClient();
        let response = client.request('GET', 'http://localhost:8057/chunked');

        expect((await response.getHeaders())['transfer-encoding']).to.be.deep.equal([ 'chunked' ]);
        expect((await response.getContent()).toString()).to.be.equal('Jymfony is awesome!');

        response = client.request('GET', 'http://localhost:8057/chunked-broken', {
            timeout: 1,
        });

        this.expectException(TransportException);
        await response.getContent();
    }
}
