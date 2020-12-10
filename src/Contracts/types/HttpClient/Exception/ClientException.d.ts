declare namespace Jymfony.Contracts.HttpClient.Exception {
    export class ClientException extends mix(global.RuntimeException, ExceptionInterface, HttpExceptionTrait) {
    }
}
