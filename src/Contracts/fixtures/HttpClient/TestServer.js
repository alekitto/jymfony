const HttpServer = Jymfony.Component.HttpServer.HttpServer;
const HttpServerEvents = Jymfony.Component.HttpServer.Event.HttpServerEvents;
const Response = Jymfony.Component.HttpFoundation.Response;
const Route = Jymfony.Component.Routing.Route;
const RouteCollection = Jymfony.Component.Routing.RouteCollection;

class CompressableResponse extends Response {
    set encoding(value) {
        if (value) {
            this._encoding = 'gzip';
            this.headers.set('Content-Encoding', 'gzip');
        } else {
            this._encoding = undefined;
            this.headers.remove('Content-Encoding');
        }
    }

    // eslint-disable-next-line no-unused-vars
    _setEncodingForCompression(request) {
        // Do nothing
    }
}

const generateController = port =>
    /**
     * @param {Jymfony.Component.HttpFoundation.Request} request
     */
    async request => {
        const json = JSON.stringify(request.toJson());
        const response = new CompressableResponse(json, Response.HTTP_OK, {
            'Content-Type': 'application/json',
            Host: request.httpHost,
        });

        const route = request.attributes.get('route');
        switch (route) {
            default:
                return new Response();

            case 'head':
                response.headers.set('Content-Length', String(json.length));
                break;

            case '':
                response.encoding = true;
                break;

            case '103':
                response.setStatusCode(103, 'Early Hints');
                response.headers.set('Link', '</style.css>; rel=preload; as=style', false);
                response.headers.set('Link', '</script.js>; rel=preload; as=style', false);
                response.content = 'HTTP/1.1 200 OK\r\n' +
                    'Date: Fri, 26 May 2017 10:02:11 GMT\r\n' +
                    'Content-Length: 13\r\n' +
                    '\r\n' +
                    'Here the body';
                break;

            case '404':
                response.setStatusCode(404);
                break;

            case '/404-gzipped':
                response.setStatusCode(404);
                response.headers.set('Content-Type', 'text/plain');
                response.encoding = true;
                response.content = 'some text';
                break;

            case '301':
                if ('Basic Zm9vOmJhcg==' === request.headers.get('Authorization')) {
                    response.headers.set('Location', 'http://127.0.0.1:' + port + '/302');
                    response.setStatusCode(301);
                }
                break;

            case '301/bad-tld':
                response.headers.set('Location', 'http://foo.example.');
                response.setStatusCode(301);
                break;

            case '301/invalid':
                response.headers.set('Location', '//?foo=bar');
                response.setStatusCode(301);
                break;

            case '302':
                if (! request.headers.has('Authorization')) {
                    response.headers.set('Location', 'http://localhost:' + port + '/302');
                    response.setStatusCode(302);
                }
                break;

            case '302/relative':
                response.headers.set('Location', '..');
                response.setStatusCode(302);
                break;

            case '304':
                response.headers.set('Content-Length', '10');
                response.setStatusCode(304);
                response.content = '12345';
                break;

            case '307':
                response.headers.set('Location', 'http://localhost:' + port + '/post');
                response.setStatusCode(307);
                break;

            case 'length-broken':
                response.headers.set('Content-Length', '1000');
                break;

            case 'post':
                response.content = JSON.stringify({ ...request.request.all, REQUEST_METHOD: request.method }, null, 4);
                response.headers.set('Content-Length', String(response.content.length));
                break;

            case 'timeout-header':
                await __jymfony.sleep(30000);
                break;

            case 'timeout-body':
                response.content = async (res) => {
                    res.write('<1>');
                    await __jymfony.sleep(50000);
                    res.write('<2>');
                };
                break;

            case 'chunked':
                response.headers.set('Transfer-Encoding', 'chunked');
                response.content = res => {
                    res.write('');
                    res.write('8\r\nJymfony \r\n5\r\nis aw\r\n6\r\nesome!\r\n0\r\n\r\n');
                };
                break;

            case 'chunked-broken':
                response.headers.set('Transfer-Encoding', 'chunked');
                response.content = res => {
                    res.write('8\r\nJymfony \r\n5\r\nis aw\r\n6\r\ne');
                };
                break;

            case 'gzip-broken':
                response.headers.set('Content-Encoding', 'gzip');
                response.content = res => {
                    res.write('-'.repeat(1000));
                };
                break;

            case 'json':
                response.content = JSON.stringify({
                    documents: [
                        { id: '/json/1' },
                        { id: '/json/2' },
                        { id: '/json/3' },
                    ],
                });
                break;

            case 'json/1':
            case 'json/2':
            case 'json/3':
                response.content = JSON.stringify({
                    title: request.uri,
                });
                break;
        }

        return response;
    };

/**
 * @memberOf Jymfony.Contracts.Fixtures.HttpClient
 */
export default class TestServer {
    static createHttpServer(port) {
        const collection = new RouteCollection();
        collection.add('route', new Route(
            '{route}',
            { _controller: generateController(port) },
            { route: /.*/ },
        ));

        const server = HttpServer.create(collection);
        server.eventDispatcher.addListener(HttpServerEvents.EXCEPTION, dd);

        return server.listen({ port });
    }
}
