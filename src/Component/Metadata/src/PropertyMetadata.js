const MetadataInterface = Jymfony.Contracts.Metadata.MetadataInterface;
const MetadataPropertiesTrait = Jymfony.Component.Metadata.MetadataPropertiesTrait;

/**
 * Represents metadata for getter/setter.
 *
 * @memberOf Jymfony.Component.Metadata
 */
export default class PropertyMetadata extends implementationOf(MetadataInterface, MetadataPropertiesTrait) {
    /**
     * Constructor.
     *
     * @param {string} className
     * @param {string} name
     * @param {'get'|'set'} kind
     */
    __construct(className, name, kind) {
        /**
         * @type {string}
         */
        this.className = className;

        /**
         * @type {string}
         *
         * @private
         */
        this._name = name;

        /**
         * @type {"get"|"set"}
         */
        this.kind = kind;

        /**
         * @type {ReflectionProperty}
         *
         * @private
         */
        this._reflection = undefined;
    }

    /**
     * Gets the reflection property.
     *
     * @returns {ReflectionProperty}
     */
    get reflection() {
        if (undefined === this._reflection) {
            const reflectionClass = new ReflectionClass(this.className);
            this._reflection = new ReflectionProperty(reflectionClass, this.kind, this.name);
        }

        return this._reflection;
    }

    __sleep() {
        const parent = super.__sleep();
        parent.push('_name');

        return parent;
    }

    /**
     * @inheritdoc
     */
    merge() {
    }

    /**
     * @inheritdoc
     */
    get name() {
        return this._name;
    }
}
