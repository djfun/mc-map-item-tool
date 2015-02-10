process.env.NODE_ENV = 'test';

var http = require('http');
var crypto = require('crypto');
var querystring = require('querystring');
var fs = require('fs');

var chai = require('chai');
var handler = require('../../lib/server.js').handler;
var tmpFiles = require('../../lib/server.js').tmpFiles;
var spawn = require('child_process').spawn;
var doPostRequest = require('./test-server-helper').doPostRequest;
var doGetRequest = require('./test-server-helper').doGetRequest;

var expect = chai.expect;

describe('Server', function() {
  before(function(done) {
    var copyTestData = spawn('cp', [
      'tests/mocha/data/map_0.dat',
      'tests/mocha/data/map_0_name.dat',
      'tests/mocha/data/map_1_name.dat',
      'tests/mocha/data/map_2_name.dat',
      'tests/mocha/data/map_3_name.dat',
      'public/tmp/']);
    this.server = http.createServer(handler).listen(3000, 'localhost');
    copyTestData.on('close', function(code) {
      done();
    });
  });

  it('should serve static files', function(done) {
    doGetRequest('/', function(res, body) {
      expect(body).to.contain('MC Map Item Tool');
      done();
    });
  });

  it('should create a single map file', function(done) {
    var mapitem = fs.readFileSync('tests/mocha/data/mapitem.json', {encoding: 'utf8'});
    var map = {
      map_item: mapitem,
      x_center: "0",
      z_center: "0",
      dimension: "0",
      randomid: ""
    };
    doPostRequest('/createfile', map, function(res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body).to.equal('f5289678bb41ad3b85f1dd9d378b25df398ea045');
      done();
    });
  });

  it('should create a zip file from multiple map files', function(done) {
    tmpFiles.addFile("map_0_name.dat");
    tmpFiles.addFile("map_1_name.dat");
    tmpFiles.addFile("map_2_name.dat");
    tmpFiles.addFile("map_3_name.dat");
    var mapfiles = [
      "map_0_name",
      "map_1_name",
      "map_2_name",
      "map_3_name"
    ];
    var postData = {
      mapfiles: JSON.stringify(mapfiles),
      zipname: "test_zip_name",
      mapnumber: "0"
    };
    doPostRequest('/createzip', postData, function(res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body).to.equal('test_zip_name');
      done();
    });
  });

  it('should serve map files', function(done) {
    doGetRequest('/tmp/map_0.dat', function(res, body) {
      var shasum = crypto.createHash('sha1');
      shasum.update(body);
      expect(shasum.digest('hex')).to.equal('97a74755132eab3e0d1ea79a58632648813f808b');
      done();
    });
  });

  it('should handle zip creation when the number of maps is greater than the file handle limit', function(done) {
    this.timeout(0);
    tmpFiles.addFile("map_0_name.dat");
    var mapfiles = [];
    for (var i = 0; i<1030; i++) {
      mapfiles.push("map_0_name");
    }
    var postData = {
      mapfiles: JSON.stringify(mapfiles),
      zipname: "test_zip_name_1",
      mapnumber: "0"
    };
    doPostRequest('/createzip', postData, function(res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body).to.equal('test_zip_name_1');
      done();
    });
  });

  it('should handle irregular inputs and return a 400 error', function(done) {
    var mapitem = fs.readFileSync('tests/mocha/data/mapitem.json', {encoding: 'utf8'});
    mapitem = JSON.parse(mapitem);
    mapitem[50] = 128;
    var map = {
      map_item: JSON.stringify(mapitem),
      x_center: "0",
      z_center: "0",
      dimension: "0",
      randomid: ""
    };
    doPostRequest('/createfile', map, function(res, body) {
      expect(res.statusCode).to.equal(400);
      done();
    });
  });

  after(function(done) {
    this.server.close(done);
  });
});