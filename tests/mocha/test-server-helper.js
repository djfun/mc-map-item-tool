var http = require('http');
var querystring = require('querystring');

function doPostRequest(path, data, callback) {
  var dataString = querystring.stringify(data);
  var body = '';
  var postRequest = http.request({
    host: 'localhost',
    port: 3000,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': dataString.length
    }}, function(res) {
      res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      callback(res, body);
    });
  });
  postRequest.write(dataString);
  postRequest.end();
}

function doGetRequest(path, callback) {
  var body = '';
  http.get({host: 'localhost', port: 3000, path: path}, function(res) {
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      callback(res, body);
    });
  });
}

module.exports.doPostRequest = doPostRequest;
module.exports.doGetRequest = doGetRequest;