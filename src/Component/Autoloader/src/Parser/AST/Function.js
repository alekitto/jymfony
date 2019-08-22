const Identifier = require('./Identifier');
const NodeInterface = require('./NodeInterface');

/**
 * @memberOf Jymfony.Component.Autoloader.Parser.AST
 */
class Function extends implementationOf(NodeInterface) {
    /**
     * Constructor.
     *
     * @param {Jymfony.Component.Autoloader.Parser.AST.SourceLocation} location
     * @param {Jymfony.Component.Autoloader.Parser.AST.BlockStatement} body
     * @param {Jymfony.Component.Autoloader.Parser.AST.Identifier|null} [id]
     * @param {Jymfony.Component.Autoloader.Parser.AST.PatternInterface[]} params
     * @param {boolean} generator
     * @param {boolean} async
     */
    __construct(location, body, id = null, params = [], { generator = false, async = false } = {}) {
        /**
         * @type {Jymfony.Component.Autoloader.Parser.AST.SourceLocation}
         */
        this.location = location;

        /**
         * @type {Jymfony.Component.Autoloader.Parser.AST.BlockStatement}
         *
         * @private
         */
        this._body = body;

        /**
         * @type {Jymfony.Component.Autoloader.Parser.AST.Identifier}
         *
         * @private
         */
        this._id = id || new Identifier(null, '_anonymous_xΞ' + (~~(Math.random() * 1000000)).toString(16));

        /**
         * @type {Jymfony.Component.Autoloader.Parser.AST.PatternInterface[]}
         *
         * @private
         */
        this._params = params;

        /**
         * @type {boolean}
         *
         * @private
         */
        this._generator = generator;

        /**
         * @type {boolean}
         *
         * @private
         */
        this._async = async;

        /**
         * @type {null|string}
         */
        this.docblock = null;
    }

    /**
     * Gets the function identifier.
     *
     * @returns {Jymfony.Component.Autoloader.Parser.AST.Identifier}
     */
    get id() {
        return this._id;
    }

    /**
     * Gets the function name.
     *
     * @return {string}
     */
    get name() {
        return this._id.name;
    }

    /**
     * Gets the function body (block statement).
     *
     * @return {Jymfony.Component.Autoloader.Parser.AST.BlockStatement}
     */
    get body() {
        return this._body;
    }

    static compileParams(compiler, params) {
        compiler._emit('(');
        for (const i in params) {
            compiler.compileNode(params[i]);
            if (i != params.length - 1) {
                compiler._emit(',');
            }
        }
        compiler._emit(')');
    }
}

module.exports = Function;