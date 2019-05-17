global.__jymfony = global.__jymfony || {};

let _asyncSupport = undefined;
let _asyncGeneratorSupport = undefined;
let _modernRegex = undefined;
let _publicFields = undefined;
let _privateFields = undefined;

/**
 * @memberOf __jymfony
 */
class Platform {
    /**
     * Checks if this node version has async function support.
     *
     * @returns {boolean}
     */
    static hasAsyncFunctionSupport() {
        if (undefined === _asyncSupport) {
            _asyncSupport = false;

            try {
                let fn;
                eval('fn = async function () { }');
                _asyncSupport = 'AsyncFunction' === (fn.constructor.name || fn.constructor.displayName);
            } catch (e) {
                if (!(e instanceof SyntaxError)) {
                    throw e;
                }
            }
        }

        return _asyncSupport;
    }

    /**
     * Checks if this node version has async function support.
     *
     * @returns {boolean}
     */
    static hasAsyncGeneratorFunctionSupport() {
        if (undefined === _asyncGeneratorSupport) {
            _asyncGeneratorSupport = false;

            try {
                let fn;
                eval('fn = async function * () { }');
                _asyncGeneratorSupport = 'AsyncGeneratorFunction' === (fn.constructor.name || fn.constructor.displayName);
            } catch (e) {
                if (!(e instanceof SyntaxError)) {
                    throw e;
                }
            }
        }

        return _asyncGeneratorSupport;
    }

    /**
     * Are we running on windows?
     *
     * @returns {boolean}
     */
    static isWindows() {
        return 'win32' === process.platform;
    }

    /**
     * Checks if this node version has modern regex (named groups) support.
     *
     * @returns {boolean}
     */
    static hasModernRegex() {
        if (undefined === _modernRegex) {
            _modernRegex = false;

            try {
                RegExp('(?<test>.+)');
                _modernRegex = true;
            } catch (e) {
                if (!(e instanceof SyntaxError)) {
                    throw e;
                }
            }
        }

        return _modernRegex;
    }

    /**
     * Checks if this node version has public instance fields support.
     *
     * @returns {boolean}
     */
    static hasPublicFieldSupport() {
        if (undefined === _publicFields) {
            _publicFields = false;

            try {
                let c;
                eval('c = class ev { field = "foobar"; }');

                const i = new c();
                return _publicFields = 'foobar' === i.field;
            } catch (e) {
                if (!(e instanceof SyntaxError)) {
                    throw e;
                }
            }
        }

        return _publicFields;
    }

    /**
     * Checks if this node version has private instance fields support.
     *
     * @returns {boolean}
     */
    static hasPrivateFieldSupport() {
        if (undefined === _privateFields) {
            _privateFields = false;

            try {
                let c;
                eval('c = class ev { #field = "foobar"; get field() { return this.#field; } }');

                const i = new c();
                return _privateFields = 'foobar' === i.field;
            } catch (e) {
                if (!(e instanceof SyntaxError)) {
                    throw e;
                }
            }
        }

        return _privateFields;
    }
}

__jymfony.Platform = Platform;
