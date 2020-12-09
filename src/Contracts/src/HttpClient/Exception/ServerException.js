const ExceptionInterface = Jymfony.Contracts.HttpClient.Exception.ExceptionInterface;
const HttpExceptionTrait = Jymfony.Contracts.HttpClient.Exception.HttpExceptionTrait;

/**
 * @memberOf Jymfony.Contracts.HttpClient.Exception
 */
export default class ServerException extends mix(global.RuntimeException, ExceptionInterface, HttpExceptionTrait) {
}
