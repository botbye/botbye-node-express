"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
exports.validateRequest = validateRequest;
var botbye_node_core_1 = require("botbye-node-core");
(0, botbye_node_core_1.initPackageInfo)({ name: "EXPRESS", version: "1.0.8" });
function init(options) {
    (0, botbye_node_core_1.init)(options);
    return validateRequest;
}
function validateRequest(options) {
    var token = options.token || "";
    var request = options.request;
    var customFields = options.customFields;
    var headers = request.headers;
    var requestInfo = {
        request_uri: request.url,
        request_method: request.method,
        remote_addr: request.ip || request.socket.remoteAddress || "",
    };
    return (0, botbye_node_core_1.validateRequest)({
        token: token,
        headers: headers,
        requestInfo: requestInfo,
        customFields: customFields,
    });
}
