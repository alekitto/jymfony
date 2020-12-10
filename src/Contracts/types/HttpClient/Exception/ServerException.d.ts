declare namespace Jymfony.Contracts.HttpClient.Exception {
    export class ServerException extends mix(global.RuntimeException, ExceptionInterface, HttpExceptionTrait) {
    }
}
