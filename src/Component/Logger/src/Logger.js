const AbstractLogger = Jymfony.Component.Logger.AbstractLogger;
const LogicException = Jymfony.Component.Logger.Exception.LogicException;
const LogLevel = Jymfony.Component.Logger.LogLevel;

/**
 * @memberOf Jymfony.Component.Logger
 */
class Logger extends AbstractLogger {
    /**
     * Construct the logger
     *
     * @param {string} name
     * @param {Jymfony.Component.Logger.Handler.HandlerInterface[]} handlers
     * @param {Function[]} processors
     */
    constructor(name, handlers = [], processors = []) {
        super();

        this._name = name;
        this._handlers = handlers;
        this._processors = processors;
    }

    /**
     * Get the logger name.
     *
     * @returns {string}
     */
    get name() {
        return this._name;
    }

    /**
     * Returns a new cloned instance with name changed.
     *
     * @param {string} name
     * @returns {Jymfony.Component.Logger.Logger}
     */
    withName(name) {
        return new Logger(name, [ ...this._handlers ], [ ...this._processors ]);
    }

    /**
     * Pushes an handler onto the stack.
     *
     * @param {Jymfony.Component.Logger.Handler.HandlerInterface} handler
     *
     * @returns {Jymfony.Component.Logger.Logger}
     */
    pushHandler(handler) {
        this._handlers.unshift(handler);
        return this;
    }

    /**
     * Pops out an handler off the stack.
     *
     * @returns {Jymfony.Component.Logger.Handler.HandlerInterface}
     * @throws {Jymfony.Component.Logger.Exception.LogicException}
     */
    popHandler() {
        if (! this._handlers.length) {
            throw new LogicException('You tried to pop an handler out of an empty stack');
        }

        return this._handlers.shift();
    }

    /**
     * Set handlers.
     *
     * @param {Jymfony.Component.Logger.Handler.HandlerInterface[]} handlers
     */
    set handlers(handlers) {
        if (! isArray(handlers)) {
            handlers = Object.values(handlers);
        }

        for (let handler of handlers.reverse()) {
            this.pushHandler(handler);
        }
    }

    /**
     * Get all handlers.
     *
     * @returns {Jymfony.Component.Logger.Handler.HandlerInterface[]}
     */
    get handlers() {
        return [ ...this._handlers ];
    }

    /**
     * Push a logger processor.
     *
     * @param {Function} processor
     *
     * @returns {Jymfony.Component.Logger.Logger}
     */
    pushProcessor(processor) {
        this._processors.unshift(processor);
        return this;
    }

    /**
     * Pops out a processor off the stack.
     *
     * @returns {Jymfony.Component.Logger.Handler.HandlerInterface}
     * @throws {Jymfony.Component.Logger.Exception.LogicException}
     */
    popProcessor() {
        if (! this._processors.length) {
            throw new LogicException('You tried to pop a processor out of an empty stack');
        }

        return this._processors.shift();
    }

    /**
     * Gets the processor array.
     *
     * @returns {Function[]}
     */
    get processors() {
        return [ ...this._processors ];
    }

    /**
     * Adds a record to the log.
     *
     * @param {int} level
     * @param {string} message
     * @param {Object.<*>} context
     *
     * @returns {boolean}
     */
    addRecord(level, message, context) {
        let levelName = this.constructor.levels[level];

        let it = __jymfony.getEntries(this._handlers);
        let handlerKey, handler;
        while (handler = it.value[1]) {
            if (handler.isHandling({ level: level })) {
                handlerKey = it.value[0];
                break;
            }

            it.next();
        }

        if (undefined === handlerKey) {
            return false;
        }

        let record = {
            message: message,
            context: context,
            level: level,
            levelName: levelName,
            channel: this._name,
            datetime: new Date(),
            extra: {},
        };

        for (let processor of this._processors) {
            record = processor(record);
        }

        while (handler = it.value[1]) {
            if (true === handler.handle(record)) {
                break;
            }

            it.next();
        }

        return true;
    }

    /**
     * Checks if there's a handler that listen on level
     *
     * @param {int} level
     */
    isHandling(level) {
        let record = { level: level };
        let it = __jymfony.getEntries(this._handlers);
        let handler;

        while (handler = it.value[1]) {
            if (handler.isHandling(record)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Adds a record to the log
     *
     * @param {int} level
     * @param {string} message
     * @param {Object.<*>} context
     */
    log(level, message, context) {
        this.addRecord(level, message.toString(), context);
    }
}

Logger.levels = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.NOTICE]: 'NOTICE',
    [LogLevel.WARNING]: 'WARNING',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.CRITICAL]: 'CRITICAL',
    [LogLevel.ALERT]: 'ALERT',
    [LogLevel.EMERGENCY]: 'EMERGENCY',
};
