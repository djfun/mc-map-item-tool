var node_static = require('node-static');
var app = require('http').createServer(handler);
var url  = require('url');

var querystring = require('querystring');

var file = new(node_static.Server)('./public');

var fs = require('fs');
var TAG = require('node-nbt').TAG;
var NbtReader = require('node-nbt').NbtReader;
var NbtWriter = require('node-nbt').NbtWriter;

var zlib = require('zlib');

var crypto = require('crypto');

var archiver = require('archiver');

var poolModule = require('generic-pool');

// on start delete all files in ./tmp
fs.readdir('./public/tmp', function(err, files) {
  if (err) {
    throw err;
  } else {
    for (var i = 0; i < files.length; i++) {
      delete_tmp_files(files[i]);
    }
  }
});

var delete_tmp_files = function (file) {
  fs.unlink('./public/tmp/' + file, function (err) {
    if (err) {
      throw err;
    } else {
      console.log(myDate.getCurrent() + ' Successfully deleted /tmp/' + file);
    }
  });
};

var tmp_files = {
  addFile: function(hash) {
    this.files[hash] = (new Date()).getTime();
    this.removeOldFiles();
  },
  removeOldFiles: function() {
    var time = (new Date()).getTime();
    for (var hash in this.files) {
      if (this.files[hash] < time - (30 * 60 * 1000)) {
        delete_tmp_files(hash);
        delete this.files[hash];
      }
    }
  },
  files: {}
};

function NotInTmpFilesException(value) {
  this.value = value;
  this.message = " is not in tmp_files";
  this.toString = function() {
    return 'NotInTmpFilesException: ' + this.value + this.message;
  };
}

app.listen(process.env.PORT || 8080, process.env.HOST || 'localhost');

function handler (req, res) {
  var referer = req.headers.referer;
  if (referer) {
    if (referer.indexOf(req.headers.host) !== 7) {
      console.log(myDate.getCurrent() + ' Referer: ' + referer);
    }
  }

  var body='';
  req.on('data', function (data) {
    body +=data;
  });
  req.addListener('end', function () {
    var error, decodedBody, map_item_array, x_center, z_center, dimension, randomid, mapnumber;
    if (req.method == 'GET' && req.url.substr(0, 4) == '/tmp') {
      var url_parts = url.parse(req.url, true);
      var query = url_parts.query;
      var pathname = url_parts.pathname;
      if (tmp_files.files[pathname.substr(5)]) {
        try {
          console.log(myDate.getCurrent() + ' Serve tmp file: ' + pathname);
          
          mapnumber = parseInt(query.mapnumber, 10) || 0;
          var downloadfilename = pathname.slice(-3) == 'dat' ? 'map_' + mapnumber + '.dat' : 'map_items.zip';
          file.serveFile(pathname, 200,
            {'Content-Disposition': 'attachment; filename="' + downloadfilename + '"'}, req, res);
        } catch (e) {
          console.log(myDate.getCurrent() + ' Error:');
          console.log(e);
          res.writeHead(500);
          res.end("Internal server error");
        }
      } else {
        res.writeHead(404);
        res.end("File doesn't exist");
      }
    } else if (req.method == 'POST' && req.url == '/createfile') {
      try {
        decodedBody = querystring.parse(body);
        // console.log(JSON.stringify(decodedBody));
        map_item_array = JSON.parse(decodedBody.map_item);
        x_center = parseInt(decodedBody.x_center, 10);
        z_center = parseInt(decodedBody.z_center, 10);
        dimension = parseInt(decodedBody.dimension, 10);
        randomid = decodedBody.randomid;
        if (randomid !== "") {
          randomid+= "_";
        }
        error = false;
        // console.log(map_item_array.length);
        if (map_item_array.length == 16384) {
          for (var i = 0; i < map_item_array.length; i++) {
            if (map_item_array[i] > 128) {
              error = true;
            }
          }
        } else {
          error = true;
        }
      } catch (e) {
        error = true;
        console.log(myDate.getCurrent() + ' Error:');
        console.log(e);
        res.writeHead(500);
        res.end("Internal server error");
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
        var b;
        try {
          b = NbtWriter.writeTag(map_file);
          var shasum = crypto.createHash('sha1');
          shasum.update(b);
          var filename = randomid + shasum.digest('hex');
          tmp_files.addFile(filename + '.dat');
          zlib.gzip(b, function(err, data) {
            if (err) {
              res.writeHead(500);
              res.end("Internal server error");
              console.log(myDate.getCurrent() + ' Error:');
              console.log(err);
            } else {
              pool.acquire(function(err, client) {
                if (err) {
                  res.writeHead(500);
                  res.end("Internal server error");
                  console.log(myDate.getCurrent() + ' Error:');
                  console.log(e);
                } else {
                  fs.writeFile('public/tmp/' + filename + '.dat', data, function(err) {
                    if (!err) {
                      console.log(myDate.getCurrent() + ' Map file written to disk: ' + filename + '.dat');
                      res.setHeader('Content-Type', 'text/html');
                      res.writeHead(200);
                      res.end(filename);
                      // res.end('<a href="tmp/' + filename + '.dat">Download</a>');
                    } else {
                      res.writeHead(500);
                      res.end("Internal server error");
                      console.log(err);
                    }
                    pool.release(client);
                  });
                }
              });
            }
          });
        } catch (e) {
          // error with writing the file
          res.writeHead(500);
          res.end("Internal server error");
          console.log(myDate.getCurrent() + ' Error:');
          console.log(e);
        }
      } else {
        console.log(myDate.getCurrent() + ' 400 Bad request');
        res.writeHead(400);
        res.end("Bad request");
      }
    } else if (req.method == 'POST' && req.url == '/createzip') {
      var mapfiles, zipname;
      try {
        decodedBody = querystring.parse(body);
        mapfiles = JSON.parse(decodedBody.mapfiles);
        zipname = decodedBody.zipname;
        mapnumber = parseInt(decodedBody.mapnumber, 10) || 0;
        tmp_files.addFile(zipname + '.zip');
        var output = fs.createWriteStream('public/tmp/' + zipname + '.zip');
        var archive = archiver('zip');
        output.on('close', function() {
          console.log(myDate.getCurrent() + ' Zip file written to disk: ' + zipname + '.zip');
          res.setHeader('Content-Type', 'text/html');
          res.writeHead(200);
          res.end(zipname);
        });
        archive.on('error', function(err) {
          throw err;
        });
        archive.pipe(output);
        var filenumber;
        for (var j = 0; j < mapfiles.length; j++) {
          if (!tmp_files.files[mapfiles[j] + '.dat']) {
            throw new NotInTmpFilesException(mapfiles[j]);
          }
          filenumber = mapnumber + j;
          addMapToZip(mapfiles[j], filenumber, archive);
        }
        archive.finalize(function(err, bytes) {
          if (err) {
            throw err;
          }
          console.log(myDate.getCurrent() + ' Zip file finalized: ' + bytes + ' total bytes');
        });
      } catch (e) {
        error = true;
        console.log(myDate.getCurrent() + ' Error: ' + e.toString());
        res.writeHead(500);
        res.end("Internal server error");
      }
    } else {
      file.serve(req, res);
    }
  });
}

function addMapToZip(filename, filenumber, archive) {
  pool.acquire(function(err, client) {
    var readable = fs.createReadStream('public/tmp/' + filename + '.dat');
    readable.on('end', function() {
      pool.release(client);
    });
    archive.append(readable, { name: 'map_' + filenumber + '.dat' });
  });
}

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

var myDate = {};

myDate.getCurrent = function(timestamp) {
  var d = new Date();
  if (timestamp) {
    d.setTime(timestamp);
  }
  var hours = d.getHours();
  hours = hours < 10 ? '0' + hours : hours;
  var minutes = d.getMinutes();
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var seconds = d.getSeconds();
  seconds = seconds < 10 ? '0' + seconds : seconds;

  var day = d.getDate();
  day = day < 10 ? '0' + day : day;
  var month = d.getMonth() + 1;
  month = month < 10 ? '0' + month : month;
  var year = d.getFullYear();


  return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
};

console.log(myDate.getCurrent() + ' Started mc-map-item-tool server');