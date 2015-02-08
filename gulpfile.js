var gulp = require('gulp');
var del = require('del');
var merge = require('merge-stream');
var mkdirp = require('mkdirp');
var to5 = require("gulp-6to5");

var DEST_CLIENT = 'public/';
var DEST_SERVER = 'lib/';

gulp.task('default', function() {
  var client = gulp.src('src/client/*')
    .pipe(gulp.dest(DEST_CLIENT));
  var vendor = gulp.src('vendor/**')
    .pipe(gulp.dest(DEST_CLIENT));
  var assets = gulp.src(['assets/**', '!assets/html/*'])
    .pipe(gulp.dest(DEST_CLIENT));
  var assets_html = gulp.src('assets/html/*')
    .pipe(gulp.dest(DEST_CLIENT));
  var server = gulp.src('src/server/*')
    .pipe(to5())
    .pipe(gulp.dest(DEST_SERVER));

  mkdirp.sync('public/tmp');

  return merge(client, vendor, assets, assets_html, server);
});

gulp.task('clean', function(cb) {
  del([
    'public/*',
    'lib/*'
  ], cb);
});