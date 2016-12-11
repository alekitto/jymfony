/**
 * @memberOf Jymfony.EventDispatcher
 * @type {Jymfony.EventDispatcher.Event}
 */
class Event {
    constructor() {
        this._propagationStopped = false;
    }

    isPropagationStopped() {
        return this._propagationStopped;
    }

    stopPropagation() {
        this._propagationStopped = true;
    }
}

module.exports = Event;