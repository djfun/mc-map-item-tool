var node_static = require('node-static');
var app = require('http').createServer(handler);

var querystring = require('querystring');

var file = new(node_static.Server)('./public');

var fs = require('fs');
var TAG = require('node-nbt').TAG;
var NbtReader = require('node-nbt').NbtReader;
var NbtWriter = require('node-nbt').NbtWriter;

var zlib = require('zlib');

var crypto = require('crypto');


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
      console.log('successfully deleted /tmp/' + file);
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
      if (this.files[hash] < time - 300000) {
        delete this.files[hash];
      }
    }
  },
  files: {}
};

app.listen(8080);

function handler (req, res) {
  var body='';
  req.on('data', function (data) {
    body +=data;
  });
  req.addListener('end', function () {
    var error, decodedBody, map_item_array;
    if (req.method == 'GET' && req.url.substr(0, 4) == '/tmp') {
      if (tmp_files.files[req.url.substr(5, 40)]) {
        console.log('serve tmp file');
        file.serveFile(req.url, 200,
          {'Content-Disposition': 'attachment; filename="map_0.dat"'}, req, res);
      } else {
        res.writeHead(404);
        res.end("File doesn't exist");
      }
    } else if (req.method == 'POST' && req.url == '/createfile') {
      try {
        decodedBody = querystring.parse(body);
        // console.log(JSON.stringify(decodedBody));
        map_item_array = JSON.parse(decodedBody.map_item);
        error = false;
        // console.log(map_item_array.length);
        if (map_item_array.length == 16384) {
          for (var i = 0; i < map_item_array.length; i++) {
            if (map_item_array[i] > 55) {
              error = true;
            }
          }
        } else {
          error = true;
        }
      } catch (e) {
        error = true;
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
                  val: 0
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
                  val: 0
                },
                {
                  name: 'zCenter',
                  type: TAG.INT,
                  val: 0
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
        var b = NbtWriter.writeTag(map_file);
        var shasum = crypto.createHash('sha1');
        shasum.update(b);
        var filename = shasum.digest('hex');
        tmp_files.addFile(filename);
        zlib.gzip(b, function(err, data) {
          if (err) {
            res.writeHead(500);
            res.end("Internal server error");
            console.log(err);
          } else {
            fs.writeFile('public/tmp/' + filename + '.dat', data, function(err) {
              if (!err) {
                console.log('file should have been written');
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(200);
                res.end('<a href="tmp/' + filename + '.dat">Download</a>');
              } else {
                res.writeHead(500);
                res.end("Internal server error");
                console.log(err);
              }
            });
          }
        });
      } else {
        res.writeHead(400);
        res.end("Bad request");
      }
    } else {
      file.serve(req, res);
    }
  });
}