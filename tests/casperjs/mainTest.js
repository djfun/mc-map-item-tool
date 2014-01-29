String.prototype.hashCode = function() {
  var hash = 0;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

casper.test.begin('mainjs - 1 map', 7, {
  setUp: function(test) {
    var fs = require('fs');
    this.workingdir = fs.workingDirectory;
  },

  tearDown: function(test) {
    //
  },

  test: function(test) {
    var workingdir = this.workingdir;

    casper.start(workingdir + "/public/index.html", function step1() {

      test.assertTitle("mc-map-item-tool");
      test.assertExists('#uploadimage');

      this.fill('form', {
        'img': workingdir + "/tests/casperjs/testdata/2013-10-18_00.28.30.png"
      }, false);
    });

    casper.then(function step2() {

      this.waitUntilVisible('.step-2', function() {

        test.assertElementCount('#number_horizontal option', 6);
        test.assertElementCount('#number_vertical option', 3);

        this.fill('form', {
          'width_horizontal': 1,
          'width_vertical': 1
        }, false);

        this.click("#selectnumberofparts");
      });

    });

    casper.then(function step3() {
      this.waitUntilVisible('.step-3', function() {
        this.scrollTo(0, 0);
        test.assertEquals(this.captureBase64('png', '#canvas').hashCode(), -1359257648, 'canvas has correct content');

        this.click("#reducecolors");
      });
    });

    casper.then(function step4() {
      this.waitUntilVisible('.step-4', function() {
        this.scrollTo(0, 0);
        test.assertEquals(this.captureBase64('png', '#canvas').hashCode(), -1405170529, 'canvas has correct content after conversion');

        var old_function = this.evaluate(function() {
          var old_function = $.post;
          $.post = function(url, data, callback) {
            window.callPhantom({
              type: 'ajax.post',
              url: url,
              data: data
            });
            callback('some data');
          };
          $.post._oldfunction = old_function;
          return old_function;
        });

        this.click("#createfile");
      });
    });

    casper.then(function step5() {
      this.waitUntilVisible('.step-5', function() {
        // this.echo(this.getHTML('#ajaxreply'));
      });
    });

    casper.on('remote.callback', function(o) {
      if (o.type == 'ajax.post') {
        // this.echo("ajax.post event");
        test.assertEquals(o.data.map_item.hashCode(), 1654242093, 'correct map-item array sent to server');
      }
    });

    casper.on('remote.message', function(msg) {
      this.echo('remote message caught: ' + msg);
    });

    casper.run(function() {
      test.done();
    });
  }
});