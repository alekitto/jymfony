declare namespace Jymfony.Contracts.HttpClient.Exception {
    /**
     * Represents a 3xx response.
     *
     * @final
     */
    export class RedirectionException extends mix(global.RuntimeException, ExceptionInterface, HttpExceptionTrait) {
    }
}
