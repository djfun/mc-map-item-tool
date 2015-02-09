"use strict";

require("6to5/polyfill");

var zlib = require('zlib');
var url = require('url');
var fs = require('fs');
var http = require('http');

var nodeStatic = require('node-static');
var querystring = require('querystring');
var crypto = require('crypto');
var archiver = require('archiver');
var poolModule = require('generic-pool');
var moment = require('moment');

var file = new (nodeStatic.Server)('./public');
var TAG = require('node-nbt').TAG;
var NbtReader = require('node-nbt').NbtReader;
var NbtWriter = require('node-nbt').NbtWriter;

var TMP_DIR = './public/tmp/';

var tmpFiles = {
  addFile(hash) {
    this.files[hash] = (new Date()).getTime();
    this.removeOldFiles();
  },
  removeOldFiles() {
    var time = (new Date()).getTime();
    for (let hash in this.files) {
      if (this.files[hash] < time - (30 * 60 * 1000)) {
        deleteTmpFiles(hash);
        delete this.files[hash];
      }
    }
  },
  files: {}
};

var pool = poolModule.Pool({
  name     : 'readwritefile',
  create   : function(callback) {
    var resource = {};
    callback(null, resource);
  },
  destroy  : function(client) { },
  max      : 50,
  // specifies how long a resource can stay idle in pool before being removed
  idleTimeoutMillis : 30000,
   // if true, logs via console.log - can also be a function
  log : false
});

var app;

function log(message) {
  console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} ${message}`);
}

function deleteTmpFiles (file) {
  fs.unlink(`${TMP_DIR}${file}`, function (err) {
    if (err) {
      throw err;
    } else {
      log(`Successfully deleted /tmp/${file}`);
    }
  });
}

function addMapToZip(filename, filenumber, archive) {
  pool.acquire(function(err, client) {
    var readable = fs.createReadStream(`${TMP_DIR}${filename}.dat`);
    readable.on('end', function() {
      pool.release(client);
    });
    archive.append(readable, { name: `map_${filenumber}.dat` });
  });
}

function NotInTmpFilesException(value) {
  this.filename = value;
  this.toString = () => `NotInTmpFilesException: ${this.filename} is not in tmpFiles`;
}

var handlers = {
  logReferer(req) {
    var referer = req.headers.referer;
    if (referer) {
      if (referer.indexOf(req.headers.host) !== 7) {
        log(`Referer: ${referer}`);
      }
    }
  },
  serveTmpFile(req, res) {
    var url_parts = url.parse(req.url, true);
    var {query, pathname} = url_parts;
    if (tmpFiles.files[pathname.substr(5)]) {
      try {
        log(`Serve tmp file: ${pathname}`);
        
        let mapnumber = parseInt(query.mapnumber, 10) || 0;
        let downloadfilename = pathname.slice(-3) == 'dat' ? `map_${mapnumber}.dat` : 'map_items.zip';
        file.serveFile(pathname, 200,
          {'Content-Disposition': `attachment; filename="${downloadfilename}"`}, req, res);
      } catch (e) {
        handlers.handleError(e, res);
      }
    } else {
      res.writeHead(404);
      res.end("File doesn't exist"); 
    }
  },
  createMapFile(req, res, body) {
    var map_item_array;
    var x_center;
    var z_center;
    var dimension;
    var randomid;
    var error;
    try {
      let decodedBody = querystring.parse(body);
      // log(JSON.stringify(decodedBody));
      map_item_array = JSON.parse(decodedBody.map_item);
      x_center = parseInt(decodedBody.x_center, 10);
      z_center = parseInt(decodedBody.z_center, 10);
      dimension = parseInt(decodedBody.dimension, 10);
      randomid = decodedBody.randomid;
      if (randomid !== "") {
        randomid+= "_";
      }
      error = false;
      // log(map_item_array.length);
      if (map_item_array.length == 16384) {
        for (let element of map_item_array.values()) {
          if (element > 128) {
            error = true;
          }
        }
      } else {
        error = true;
      }
    } catch (e) {
      error = true;
      handlers.handleError(e, res);
    }
    if (!error) {
      var map_file = {
        type: TAG.COMPOUND,
        name: '',
        val: [
          {
            name: 'data',
            type: TAG.COMPOUND,
            val: [
              {
                name: 'scale',
                type: TAG.BYTE,
                val: 0
              },
              {
                name: 'dimension',
                type: TAG.BYTE,
                val: dimension
              },
              {
                name: 'height',
                type: TAG.SHORT,
                val: 128
              },
              {
                name: 'width',
                type: TAG.SHORT,
                val: 128
              },
              {
                name: 'xCenter',
                type: TAG.INT,
                val: x_center
              },
              {
                name: 'zCenter',
                type: TAG.INT,
                val: z_center
              },
              {
                name: 'colors',
                type: TAG.BYTEARRAY,
                val: map_item_array
              }
            ]
          }
        ]
      };
      try {
        let nbtData = NbtWriter.writeTag(map_file);
        let shasum = crypto.createHash('sha1');
        shasum.update(nbtData);
        let filename = randomid + shasum.digest('hex');
        tmpFiles.addFile(`${filename}.dat`);
        zlib.gzip(nbtData, function(err, data) {
          if (err) {
            handlers.handleError(err, res);
          } else {
            pool.acquire(function(err, client) {
              if (err) {
                handlers.handleError(err, res);
              } else {
                fs.writeFile(`${TMP_DIR}${filename}.dat`, data, function(err) {
                  if (!err) {
                    log(`Map file written to disk: ${filename}.dat`);
                    res.setHeader('Content-Type', 'text/html');
                    res.writeHead(200);
                    res.end(filename);
                  } else {
                    handlers.handleError(err, res);
                  }
                  pool.release(client);
                });
              }
            });
          }
        });
      } catch (e) {
        // error with writing the file
        handlers.handleError(e, res);
      }
    } else {
      handlers.handleError(null, res, 400);
    }
  },
  createZipFile(req, res, body) {
    try {
      let decodedBody = querystring.parse(body);
      let mapfiles = JSON.parse(decodedBody.mapfiles);
      let zipname = decodedBody.zipname;
      let mapnumber = parseInt(decodedBody.mapnumber, 10) || 0;
      tmpFiles.addFile(`${zipname}.zip`);
      let output = fs.createWriteStream(`${TMP_DIR}${zipname}.zip`);
      let archive = archiver('zip');
      output.on('close', function() {
        log(`Zip file written to disk: ${zipname}.zip`);
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(zipname);
      });
      archive.on('error', function(err) {
        throw err;
      });
      archive.pipe(output);
      let filenumber;
      for (let [index, element] of mapfiles.entries()) {
        if (!tmpFiles.files[`${element}.dat`]) {
          throw new NotInTmpFilesException(element);
        }
        filenumber = mapnumber + index;
        addMapToZip(element, filenumber, archive);
      }
      archive.finalize(function(err, bytes) {
        if (err) {
          throw err;
        }
        log(`Zip file finalized: ${bytes} total bytes`);
      });
    } catch (e) {
      handlers.handleError(e, res);
    }
  },
  handleError(err, res, statusCode=500) {
    
    res.writeHead(statusCode);
    if (statusCode == 400) {
      res.end("Bad request");
      log('Bad request');
    } else {
      res.end("Internal server error");
      log(`Error: ${err.toString()}`);
    }
  }
};

function handler (req, res) {
  handlers.logReferer(req);

  var body='';
  req.on('data', function (data) {
    body +=data;
  });
  req.addListener('end', function () {
    if (req.method == 'GET' && req.url.substr(0, 4) == '/tmp') {
      handlers.serveTmpFile(req, res);
    } else if (req.method == 'POST' && req.url == '/createfile') {
      handlers.createMapFile(req, res, body);
    } else if (req.method == 'POST' && req.url == '/createzip') {
      handlers.createZipFile(req, res, body);
    } else {
      file.serve(req, res);
    }
  });
}

function startup() {
  // on start delete all files in ./tmp
  fs.readdir('./public/tmp', function(err, files) {
    if (err) {
      throw err;
    } else {
      for (let file of files.values()) {
        deleteTmpFiles(file);
      }
    }
  });

  app = http.createServer(handler);
  app.listen(process.env.PORT || 8080, process.env.HOST);
  log('Started mc-map-item-tool server');
}

if (!module.parent) {
  startup();  
} else {
  module.exports.handler = handler;
  module.exports.tmpFiles = tmpFiles;
}