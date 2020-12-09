const ExceptionInterface = Jymfony.Contracts.HttpClient.Exception.ExceptionInterface;
const HttpExceptionTrait = Jymfony.Contracts.HttpClient.Exception.HttpExceptionTrait;

/**
 * Represents a 3xx response.
 *
 * @memberOf Jymfony.Contracts.HttpClient.Exception
 * @final
 */
export default class RedirectionException extends mix(global.RuntimeException, ExceptionInterface, HttpExceptionTrait) {
}
