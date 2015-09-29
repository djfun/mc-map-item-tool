"use strict";

require("babel/polyfill");

var zlib = require('zlib');
var url = require('url');
var fs = require('fs');
var http = require('http');

var nodeStatic = require('node-static');
var querystring = require('querystring');
var crypto = require('crypto');
var archiver = require('archiver');
var moment = require('moment');
var lazystream = require('lazystream');
var winston = require('winston');

var file = new (nodeStatic.Server)('./public');
var TAG = require('node-nbt').TAG;
var NbtReader = require('node-nbt').NbtReader;
var NbtWriter = require('node-nbt').NbtWriter;

winston.remove(winston.transports.Console);
winston.add(winston.transports.File, {
  filename: './log/mc-map.log',
  handleExceptions: true,
  json: false,
  maxsize: 99999,
  timestamp: function() { return moment().format('YYYY-MM-DD HH:mm:ss'); }
});
if (process.env.NODE_ENV != 'production') {
  winston.add(winston.transports.Console, {
    handleExceptions: true,
    json: false,
    timestamp: function() { return moment().format('YYYY-MM-DD HH:mm:ss'); },
    colorize: true,
    stringify: true
  });
}

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

var app;

function deleteTmpFiles (file) {
  fs.unlink(`${TMP_DIR}${file}`, function (err) {
    if (err) {
      let error = new Error('Error while deleting tmp files');
      error.http_code = 500;
      error.fs_error = err;
      throw error;
    } else {
      winston.log('info', `Successfully deleted /tmp/${file}`);
    }
  });
}

var handlers = {
  logReferer(req) {
    var referer = req.headers.referer;
    if (referer) {
      var host = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'] : req.headers.host;
      if (referer.indexOf(host) !== 7) {
        // only log external referers
        winston.log('info', `Referer: ${referer}`);
      }
    }
  },
  serveTmpFile(req, res) {
    var url_parts = url.parse(req.url, true);
    var {query, pathname} = url_parts;
    if (tmpFiles.files[pathname.substr(5)]) {
      try {
        winston.log('info', `Serve tmp file: ${pathname}`);
        
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
    try {
      let decodedBody = querystring.parse(body);
      winston.log('debug', 'decoded body', decodedBody);
      map_item_array = JSON.parse(decodedBody.map_item);
      x_center = parseInt(decodedBody.x_center, 10);
      z_center = parseInt(decodedBody.z_center, 10);
      dimension = parseInt(decodedBody.dimension, 10);
      randomid = decodedBody.randomid;
      if (randomid !== "") {
        randomid+= "_";
      }
      winston.log('debug', 'array length', map_item_array.length);
      if (map_item_array.length == 16384) {
        for (let element of map_item_array.values()) {
          if (element > 127) {
            let error = new Error('Illegal color value in map_item_array');
            error.http_code = 400;
            throw error;
          }
        }
      } else {
        let error = new Error('Illegal length of map_item_array');
        error.http_code = 400;
        throw error;
      }
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
      let nbtData = NbtWriter.writeTag(map_file);
      let shasum = crypto.createHash('sha1');
      shasum.update(nbtData);
      let filename = randomid + shasum.digest('hex');
      tmpFiles.addFile(`${filename}.dat`);
      zlib.gzip(nbtData, function(err, data) {
        if (err) {
          let error = new Error('Error while creating map file');
          error.http_code = 500;
          error.zlib_error = err;
          throw error;
        }
        let writeStream = new lazystream.Writable(function () {
          return fs.createWriteStream(`${TMP_DIR}${filename}.dat`)
            .on('close', function () {
              winston.log('info', `Map file written to disk: ${filename}.dat`);
              res.setHeader('Content-Type', 'text/html');
              res.writeHead(200);
              res.end(filename);
            });
        });
        writeStream.write(data);
        writeStream.end();
      });
    } catch (e) {
      handlers.handleError(e, res);
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
        winston.log('info', `Zip file written to disk: ${zipname}.zip`);
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(zipname);
      });
      archive.on('error', function(err) {
        let error = new Error('Error while creating zip archive');
        error.http_code = 500;
        error.archive_error = err;
        throw error;
      });
      archive.pipe(output);
      let filenumber;
      for (let [index, element] of mapfiles.entries()) {
        if (!tmpFiles.files[`${element}.dat`]) {
          let error = new Error(`NotInTmpFilesException: ${element} is not in tmpFiles`);
          error.http_code = 500;
          throw error;
        }
        filenumber = mapnumber + index;
        archive.file(`${TMP_DIR}${element}.dat`, {name: `map_${filenumber}.dat`});
      }
      archive.finalize(function(err, bytes) {
        if (err) {
          let error = new Error('Error while finalizing zip archive');
          error.http_code = 500;
          error.archive_error = err;
          throw error;
        }
        winston.log('info', `Zip file finalized: ${bytes} total bytes`);
      });
    } catch (e) {
      handlers.handleError(e, res);
    }
  },
  handleError(err, res) {
    
    res.writeHead(err.http_code || 500);
    if (err.http_code == 400) {
      res.end("Bad request");
      winston.log('info', 'Bad request', err.toString());
    } else {
      res.end("Internal server error");
      winston.log('info', 'Internal Server Error', err.toString());
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
  winston.log('info', 'Started mc-map-item-tool server');
}

process.on("SIGTERM", function() {
  winston.log('info', 'Received signal SIGTERM');
  process.exit();
});


if (!module.parent) {
  startup();
} else {
  module.exports.handler = handler;
  module.exports.tmpFiles = tmpFiles;
}