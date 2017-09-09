const Mixins = require('./Mixins');
const CLASS_TYPE = 'Trait';

class Traits {
    static isTrait(mixin) {
        return mixin[Mixins.classTypeSymbol] === CLASS_TYPE;
    }

    static create(definition) {
        let inherits = new Map();
        let parent = definition;
        do {
            if (parent.prototype) {
                for (let p of [ ...Object.getOwnPropertyNames(parent.prototype), ...Object.getOwnPropertySymbols(parent.prototype) ]) {
                    if (inherits.has(p)) {
                        continue;
                    }

                    inherits.set(p, Object.getOwnPropertyDescriptor(parent.prototype, p));
                }
            }
        } while (parent = Object.getPrototypeOf(parent));

        let mixin = Mixins.createMixin(definition, trait => {
            for (let [ prop, descriptor ] of inherits.entries()) {
                if ('constructor' === prop || '__construct' === prop) {
                    continue;
                }

                Object.defineProperty(trait.prototype, prop, descriptor);
            }
        }, obj => {
            if (isFunction(definition.prototype.__construct)) {
                definition.prototype.__construct.call(obj);
            }
        });

        Object.setPrototypeOf(mixin, {
            definition: definition,
            [Mixins.classTypeSymbol]: CLASS_TYPE,
        });

        return mixin;
    }
}

module.exports = Traits;
