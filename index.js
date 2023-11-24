const core = require("botbye-node-core");

core.initPackageInfo({name: 'NodeJS-Express', version: '1.0'});

function init(serverKey) {
  core.init(serverKey);

  return validateRequest;
}

function validateRequest(token, request, customFields) {
  var headers = request.headers;

  var requestInfo = {
    'request_uri': request.url,
    'request_method': request.method,
    'remote_addr': request.connection.remoteAddress,
  }

  return core.validateRequest(token, headers, requestInfo, customFields)
}

module.exports = {
  init,
  validateRequest,
}
