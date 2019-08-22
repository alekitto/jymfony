const AssignmentExpression = require('./AssignmentExpression');
const Class = require('./Class');
const ExpressionStatement = require('./ExpressionStatement');
const Function = require('./Function');
const Identifier = require('./Identifier');
const MemberExpression = require('./MemberExpression');
const ModuleDeclarationInterface = require('./ModuleDeclarationInterface');
const VariableDeclaration = require('./VariableDeclaration');

/**
 * @memberOf Jymfony.Component.Autoloader.Parser.AST
 */
class ExportNamedDeclaration extends implementationOf(ModuleDeclarationInterface) {
    /**
     * Constructor.
     *
     * @param {Jymfony.Component.Autoloader.Parser.AST.SourceLocation} location
     * @param {Jymfony.Component.Autoloader.Parser.AST.VariableDeclaration} declarations
     * @param {Jymfony.Component.Autoloader.Parser.AST.ExportSpecifier[]} specifiers
     * @param {Jymfony.Component.Autoloader.Parser.AST.Literal} source
     */
    __construct(location, declarations, specifiers, source) {
        /**
         * @type {Jymfony.Component.Autoloader.Parser.AST.SourceLocation}
         */
        this.location = location;

        /**
         * @type {Jymfony.Component.Autoloader.Parser.AST.VariableDeclaration}
         *
         * @private
         */
        this._declarations = declarations;

        /**
         * @type {Jymfony.Component.Autoloader.Parser.AST.ExportSpecifier[]}
         *
         * @private
         */
        this._specifiers = specifiers;

        /**
         * @type {Jymfony.Component.Autoloader.Parser.AST.Literal}
         *
         * @private
         */
        this._source = source;

        /**
         * @type {string}
         */
        this.docblock = null;
    }

    /**
     * @inheritdoc
     */
    compile(compiler) {
        if (this.docblock) {
            debugger;
        }

        if (null === this._declarations) {
            for (const specifier of this._specifiers) {
                compiler.compileNode(
                    new ExpressionStatement(null, new AssignmentExpression(
                        null,
                        '=',
                        new MemberExpression(null, new Identifier(null, 'exports'), specifier.exported),
                        specifier.local
                    ))
                );
                compiler._emit(';\n');
            }

            return;
        }

        compiler.compileNode(this._declarations);
        compiler._emit(';\n');

        if (this._declarations instanceof VariableDeclaration) {
            for (const declarator of this._declarations.declarators) {
                ExportNamedDeclaration._exportDeclarator(compiler, declarator);
            }
        } else if (this._declarations instanceof Function || this._declarations instanceof Class) {
            compiler.compileNode(
                new ExpressionStatement(null, new AssignmentExpression(
                    null,
                    '=',
                    new MemberExpression(null, new Identifier(null, 'exports'), this._declarations.id),
                    this._declarations.id
                ))
            );
        }
    }

    /**
     * Compile a declarator export.
     *
     * @param {Jymfony.Component.Autoloader.Parser.Compiler} compiler
     * @param {Jymfony.Component.Autoloader.Parser.AST.VariableDeclarator} declarator
     *
     * @private
     */
    static _exportDeclarator(compiler, declarator) {
        for (const exportedName of declarator.id.names) {
            compiler.compileNode(
                new ExpressionStatement(null, new AssignmentExpression(
                    null,
                    '=',
                    new MemberExpression(null, new Identifier(null, 'exports'), exportedName),
                    exportedName
                ))
            );
        }
    }
}

module.exports = ExportNamedDeclaration;