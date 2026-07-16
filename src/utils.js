"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestInfoExtractor = void 0;
var requestInfoExtractor = function (request, global) {
    var _a, _b;
    try {
        return {
            ip: (_b = (_a = request.ip) !== null && _a !== void 0 ? _a : request.socket.remoteAddress) !== null && _b !== void 0 ? _b : "0.0.0.0",
            requestUri: request.url,
            requestMethod: request.method,
            headers: request.headers,
        };
    }
    catch (_c) {
        global.logger.warn("Not valid type of request passed. event.request.request should be instance of express.Request. Fallback value will be used");
        return {
            ip: "0.0.0.0",
            headers: {},
        };
    }
};
exports.requestInfoExtractor = requestInfoExtractor;
