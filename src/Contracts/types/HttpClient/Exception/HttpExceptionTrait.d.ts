declare namespace Jymfony.Contracts.HttpClient.Exception {
    import ResponseInterface = Jymfony.Contracts.HttpClient.ResponseInterface;

    /**
     * @internal
     */
    export class HttpExceptionTrait {
        public static readonly definition: Newable<HttpExceptionTrait>;
        private _response: ResponseInterface;

        /**
         * Constructor.
         */
        __construct(response: ResponseInterface): void;
        constructor(response: ResponseInterface);

        public readonly response: ResponseInterface;
    }
}
