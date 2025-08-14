const core = require("botbye-node-core");

core.initPackageInfo({ name: 'NodeJS-Express', version: '1.0.6' });

function init(options) {
  core.init(options);

  return validateRequest;
}

function validateRequest(options) {
  var token = options.token
  var request = options.request;
  var customFields = options.customFields;

  var headers = request.headers;

  var requestInfo = {
    'request_uri': request.url,
    'request_method': request.method,
    'remote_addr': request.connection.remoteAddress,
  }

  return core.validateRequest({
    token: token,
    headers: headers,
    requestInfo: requestInfo,
    customFields: customFields
  })
}

module.exports = {
  init,
  validateRequest,
}
