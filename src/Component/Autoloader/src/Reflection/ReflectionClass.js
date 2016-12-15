const ReflectionException = require('../Exception/ReflectionException');

let Storage = function () {};
Storage.prototype = {};

let TheBigReflectionDataCache = new Storage();
TheBigReflectionDataCache.classes = new Storage();
TheBigReflectionDataCache.data = new Storage();

/**
 * Utility class for classes reflection
 *
 * @type {ReflectionClass}
 */
global.ReflectionClass = class ReflectionClass {
    constructor(value) {
        if (typeof value === 'string') {
            let cached = TheBigReflectionDataCache.classes[value];
            if (cached) {
                value = cached;
            } else {
                let parts = value.split('.');
                value = ReflectionClass._recursiveGet(global, parts);
            }
        } else if (typeof value === 'object' && undefined !== value.constructor) {
            value = value.constructor;
        }

        if (typeof value === 'function' && undefined === value.prototype) {
            throw new ReflectionException('Not a class');
        } else if (undefined === value) {
            throw new ReflectionException('Unknown class');
        }

        this._methods = new Storage();
        this._readableProperties = new Storage();
        this._writableProperties = new Storage();
        this._properties = new Storage();

        if (undefined !== value.__reflection) {
            this._loadFromMetadata(value);
        } else {
            this._loadWithoutMetadata(value);
        }
    }

    /**
     * Checks if a class exists
     *
     * @param {string} className
     */
    static exists(className) {
        try {
            new ReflectionClass(className);
        } catch (e) {
            if (! (e instanceof ReflectionException)) {
                throw e;
            }

            return false;
        }

        return true;
    }

    /**
     * Construct a new object
     *
     * @param {...*} var_args Arguments to constructor
     *
     * @returns {*}
     */
    newInstance(...var_args) {
        return new this._constructor(...var_args);
    }

    /**
     * Construct a new object without calling its constructor
     *
     * @returns {*}
     */
    newInstanceWithoutConstructor() {
        let surrogateCtor = () => {};
        surrogateCtor.prototype = this._constructor.prototype;

        return new surrogateCtor();
    }

    /**
     * Checks if this class contains a method
     *
     * @param {string} name
     *
     * @returns {boolean}
     */
    hasMethod(name) {
        return this._methods[name] === true;
    }

    /**
     * Checks if class has defined property (getter/setter)
     *
     * @param name
     *
     * @returns {boolean}
     */
    hasProperty(name) {
        return this._properties[name] === true;
    }

    /**
     * Checks if class has readable property (getter)
     *
     * @param name
     *
     * @returns {boolean}
     */
    hasReadableProperty(name) {
        return this._readableProperties[name] === true;
    }

    /**
     * Checks if class has writable property (setter)
     *
     * @param name
     *
     * @returns {boolean}
     */
    hasWritableProperty(name) {
        return this._readableProperties[name] === true;
    }

    /**
     * Get the fully qualified name of the reflected class
     *
     * @returns {string|undefined}
     */
    get name() {
        return this._className;
    }

    /**
     * Filename declaring this class
     *
     * @returns {string}
     */
    get filename() {
        return this._filename;
    }

    /**
     * Module object exporting this class
     *
     * @returns {Module}
     */
    get module() {
        return this._module;
    }

    /**
     * Get all methods names
     *
     * @returns {Array}
     */
    get methods() {
        return Object.keys(this._methods);
    }

    /**
     * Get properties name defined by setters/getters
     * Other properties are added dynamically and are not
     * enumerable in the prototype
     *
     * @returns {Array}
     */
    get properties() {
        return Object.keys(this._properties);
    }

    _loadFromMetadata(value) {
        let metadata = value.__reflection;
        this._className = metadata.fqcn;

        if (TheBigReflectionDataCache.classes[this._className]) {
            this._loadFromCache();
            return;
        }

        this._filename = metadata.filename;
        this._module = metadata.module;
        this._constructor = metadata.constructor;

        this._loadProperties();

        if (undefined === TheBigReflectionDataCache.classes[this._className]) {
            TheBigReflectionDataCache.classes[this._className] = metadata.constructor;
            TheBigReflectionDataCache.data[this._className] = {
                filename: this._filename,
                module: this._module,
                constructor: this._constructor,
                properties: {
                    all: Object.keys(this._properties),
                    readable: Object.keys(this._readableProperties),
                    writable: Object.keys(this._writableProperties)
                }
            }
        }
    }

    _loadFromCache() {
        let data = TheBigReflectionDataCache.data[this._className];

        let propFunc = function (storage, data) {
            for (let v of data) {
                storage[v] = true;
            }
        };

        this._filename = data.filename;
        this._module = data.module;
        this._constructor = data.constructor;
        propFunc(this._properties, data.properties.all);
        propFunc(this._readableProperties, data.properties.readable);
        propFunc(this._writableProperties, data.properties.writable);
    }

    _loadWithoutMetadata(value) {
        this._className = undefined;
        this._module = ReflectionClass._searchModule(value);
        this._filename = this._module ? this._module.filename : undefined;
        this._constructor = value;

        this._loadProperties();
    }

    _loadProperties() {
        let proto = this._constructor.prototype;
        let properties = Object.getOwnPropertyNames(proto);
        for (let name of properties) {
            if (name === 'constructor') {
                continue;
            }

            let descriptor = Object.getOwnPropertyDescriptor(proto, name);
            if (typeof descriptor.value === 'function') {
                this._methods[name] = descriptor.value;
            } else {
                if (typeof descriptor.get === 'function') {
                    this._properties[name] =
                        this._readableProperties[name] = true;
                }

                if (typeof descriptor.set === 'function') {
                    this._properties[name] =
                        this._writableProperties[name] = true;
                }
            }
        }
    }

    static _recursiveGet(start, parts) {
        let part;
        parts = [ ...parts ].reverse();

        while (part = parts.pop()) {
            start = start[part];
        }

        return start;
    }

    static _searchModule(value) {
        for (let moduleName of Object.keys(require.cache)) {
            let mod = require.cache[moduleName];
            if (mod.exports === value) {
                return mod;
            }
        }

        return undefined;
    }
};
