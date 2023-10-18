"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SdkContext = '[WebEmarsysSDK]';
const SwContext = '[WebEmarsysSW]';
// tslint:disable-next-line:no-empty
const NoopLogFn = () => { };
const loggingFunction = (context, level) => {
    return (...data) => {
        console[level](context, ...data);
    };
};
/**
 * Enables the Logger by setting all log function references to the respective
 * functions of the global console.
 */
function enableLogger(enabled, context = SdkContext) {
    const methods = ['trace', 'debug', 'info', 'warn', 'error', 'log'];
    if (enabled) {
        for (const method of methods) {
            Logger[method] = loggingFunction(context, method);
        }
    }
    else {
        for (const method of methods) {
            Logger[method] = NoopLogFn;
        }
    }
}
/**
 * The logger which provides logging functions. By default the functions
 * are disabled which means they point to the NoopLogFn.
 */
const Logger = {
    trace: NoopLogFn,
    debug: NoopLogFn,
    info: NoopLogFn,
    warn: NoopLogFn,
    error: NoopLogFn,
    log: NoopLogFn
};
const exportedParts = {
    NoopLogFn,
    enableLogger,
    SdkContext,
    SwContext,
    Logger
};
exports.default = exportedParts;
//# sourceMappingURL=logging.js.map