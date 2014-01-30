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


casper.test.begin('mainjs - 1 map - new colors', 2, {
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

      this.fill('form', {
        'img': workingdir + "/tests/casperjs/testdata/2013-10-18_00.28.30.png"
      }, false);
    });

    casper.then(function step2() {

      this.waitUntilVisible('.step-2', function() {
        this.fill('form', {
          'width_horizontal': 1,
          'width_vertical': 1
        }, false);

        this.click("#selectnumberofparts");
      });

    });

    casper.then(function step3() {
      this.waitUntilVisible('.step-3', function() {
        var old_function = this.evaluate(function() {
          var old_function_cookies = Cookies.get;
          Cookies.get = function(value) {
            if (value === 'newColors') {
              return 'yes';
            } else {
              return false;
            }
          };
          Cookies.get._oldfunction = old_function_cookies;
          return old_function_cookies;
        });

        this.click("#reducecolors");
      });
    });

    casper.then(function step4() {
      this.waitUntilVisible('.step-4', function() {
        // restore old Cookies.get() function
        this.evaluate(function() {
          var old_function_cookies = Cookies.get._oldfunction;
          Cookies.get = old_function_cookies;
        });

        this.scrollTo(0, 0);
        test.assertEquals(this.captureBase64('png', '#canvas').hashCode(), 1037695308, 'canvas has correct content after conversion');

        var old_function = this.evaluate(function() {
          var old_function_post = $.post;
          $.post = function(url, data, callback) {
            window.callPhantom({
              type: 'ajax.post',
              url: url,
              data: data
            });
            callback('theFileName');
          };
          $.post._oldfunction = old_function_post;
          return old_function_post;
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
        test.assertEquals(o.data.map_item.hashCode(), 1892122178, 'correct map-item array sent to server');
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