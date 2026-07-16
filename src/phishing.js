"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phishingFactory = exports.phishing = void 0;
var node_core_1 = require("@botbye/node-core");
var phishing_node_http_client_1 = require("@botbye/node-core/phishing-node-http-client");
var constants_1 = require("./constants");
var utils_1 = require("./utils");
var phishingFactory = function (options) {
    var _a, _b, _c, _d;
    return (0, node_core_1.phishingModuleApiFactory)({
        httpClient: phishing_node_http_client_1.nodePhishingHttpClient,
        module: {
            name: (_b = (_a = options === null || options === void 0 ? void 0 : options.module) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : constants_1.MODULE_NAME,
            version: (_d = (_c = options === null || options === void 0 ? void 0 : options.module) === null || _c === void 0 ? void 0 : _c.version) !== null && _d !== void 0 ? _d : constants_1.MODULE_VERSION,
        },
        catcherRequestInfoExtractor: utils_1.requestInfoExtractor,
    });
};
exports.phishingFactory = phishingFactory;
var phishing = phishingFactory();
exports.phishing = phishing;
