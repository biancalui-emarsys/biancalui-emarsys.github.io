"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-dynamic-delete, @typescript-eslint/prefer-optional-chain,  @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-floating-promises */
class EventEmitter {
    constructor() {
        this._events = {};
    }
    emit(evt, param) {
        const events = this._events[evt] && this._events[evt].slice();
        if (events && events.length) {
            for (let i = 0; i < events.length; i++) {
                events[i](param);
            }
        }
    }
    on(evt, fn) {
        if (!this._events[evt]) {
            this._events[evt] = [];
        }
        this._events[evt].push(fn);
        return this;
    }
    once(evt, fn) {
        let used = false;
        const oncefun = (param) => {
            if (!used) {
                used = true;
                this.removeListener(evt, oncefun);
                return fn(param);
            }
        };
        return this.on(evt, oncefun);
    }
    removeListener(evt, listener) {
        const events = this._events[evt];
        if (events) {
            const idx = events.indexOf(listener);
            if (idx > -1) {
                events.splice(idx, 1);
            }
            if (events.length < 1) {
                delete this._events[evt];
            }
        }
    }
    /**
     * Get the total number of registered listeners (for testing)
     */
    totalListenerCount() {
        let sum = 0;
        Object.keys(this._events).forEach(key => {
            sum += this._events[key].length;
        });
        return sum;
    }
    /**
     * Get number of listeners, registered for a specific event (for testing)
     */
    listenerCountFor(event) {
        const listeners = this._events[event];
        return listeners ? listeners.length : 0;
    }
}
exports.default = EventEmitter;
//# sourceMappingURL=event-emitter.js.map