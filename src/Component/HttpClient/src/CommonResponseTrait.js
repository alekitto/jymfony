const ClientException = Jymfony.Contracts.HttpClient.Exception.ClientException;
const DecodingException = Jymfony.Contracts.HttpClient.Exception.DecodingException;
const RedirectionException = Jymfony.Contracts.HttpClient.Exception.RedirectionException;
const ServerException = Jymfony.Contracts.HttpClient.Exception.ServerException;
const TransportException = Jymfony.Contracts.HttpClient.Exception.TransportException;

/**
 * @memberOf Jymfony.Component.HttpClient
 */
class CommonResponseTrait {
    __construct() {
        /**
         * @type {*}
         *
         * @private
         */
        this._decodedData = null;
    }

    /**
     * @inheritdoc
     */
    getStatusCode() {
        return this.getInfo('http_code');
    }

    /**
     * @inheritdoc
     */
    async getDecodedContent(Throw = true) {
        if (null !== this._decodedData) {
            return this._decodedData;
        }

        const headers = await this.getHeaders(Throw);
        const contentType = headers['content-type'];

        if (contentType.match(/(?:text|application)\/(?:.+\+)json/)) {
            /**
             * @type {Buffer}
             */
            const content = await this.getContent(false);
            if (0 === content.length) {
                throw new DecodingException('Response body is empty.');
            }

            try {
                this._decodedData = JSON.parse(content.toString());
            } catch (e) {
                throw new DecodingException(__jymfony.sprintf('Cannot decode content: %s', e.message), 0, e);
            }
        }

        if (null !== this._decodedData) {
            throw new DecodingException(__jymfony.sprintf('Cannot decode content of type %s', contentType));
        }

        return this._decodedData;
    }

    /**
     * @private
     */
    async _initialize() {
        const error = this.getInfo('error');
        if (null !== error) {
            throw new TransportException(error);
        }

        try {
            if (await this._initializer(this)) {
                await this._perform();
            }
        } catch (e) {
            // Persist timeouts thrown during initialization
            this._info.error = e.message;
            await this.close();

            throw e;
        }

        this._initializer = null;
    }

    /**
     * @private
     */
    _checkStatusCode() {
        const code = this.getInfo('http_code');
        if (500 <= code) {
            throw new ServerException(this);
        }

        if (400 <= code) {
            throw new ClientException(this);
        }

        if (300 <= code) {
            throw new RedirectionException(this);
        }
    }
}

export default getTrait(CommonResponseTrait);