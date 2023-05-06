var gulp = require('gulp');
var child_process = require('child_process');
var merge = require('merge-stream');
var mkdirp = require('mkdirp');
var to5 = require("gulp-babel");
var requireDir = require('require-dir');

mkdirp.sync('tasks');

var dir = requireDir('./tasks');


var DEST_CLIENT = 'public/';
var DEST_SERVER = 'lib/';

gulp.task('clean', function(cb) {
  child_process.exec('rm -rf public/* lib/*', cb);
});

gulp.task('default', gulp.series('clean', function() {
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
  mkdirp.sync('log');

  return merge(client, vendor, assets, assets_html, server);
}));

gulp.task('test:server', gulp.series('default', function() {
  var mocha = require('gulp-mocha');

  return gulp.src('tests/mocha/test-server.js', {read: false})
    .pipe(mocha({reporter: 'spec'}));
}, 'clean'));

gulp.task('test:client', gulp.series('default', function() {
  var casperJs = require('gulp-casperjs');

  return gulp.src('tests/yadda/main_test.js')
    .pipe(casperJs()); //run casperjs test
}, 'clean'));

gulp.task('test', gulp.series('test:server', 'test:client'));
