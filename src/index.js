"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phishingFactory = exports.phishing = exports.factory = exports.dev = exports.evaluate = exports.init = void 0;
var node_core_1 = require("@botbye/node-core");
var node_http_client_1 = require("@botbye/node-core/node-http-client");
var constants_1 = require("./constants");
var utils_1 = require("./utils");
var factory = function (options) {
    var _a, _b, _c, _d;
    return (0, node_core_1.moduleApiFactory)({
        httpClient: node_http_client_1.nodeHttpClient,
        module: {
            name: (_b = (_a = options === null || options === void 0 ? void 0 : options.module) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : constants_1.MODULE_NAME,
            version: (_d = (_c = options === null || options === void 0 ? void 0 : options.module) === null || _c === void 0 ? void 0 : _c.version) !== null && _d !== void 0 ? _d : constants_1.MODULE_VERSION,
        },
        requestInfoExtractor: utils_1.requestInfoExtractor,
    });
};
exports.factory = factory;
var _a = factory(), init = _a.init, evaluate = _a.evaluate, dev = _a.dev;
exports.init = init;
exports.evaluate = evaluate;
exports.dev = dev;
var phishing_1 = require("./phishing");
Object.defineProperty(exports, "phishing", { enumerable: true, get: function () { return phishing_1.phishing; } });
Object.defineProperty(exports, "phishingFactory", { enumerable: true, get: function () { return phishing_1.phishingFactory; } });
