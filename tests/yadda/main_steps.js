var English = require('yadda').localisation.English;
var Yadda = require('yadda');
var fs = require('fs');

var dictionary = new Yadda.Dictionary()
  .define('an_image_file', /(.*)/)
  .define('hashcode', /(.*)/)
  .define('element_id', /(.*)/)
  .define('data_item', '(x_center|z_center|dimension)')
  .define('value', /(.*)/);

String.prototype.hashCode = function() {
  var hash = 0;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

module.exports.init = function() {
  return English.library(dictionary)
    .given("I am on the client side version of the index page", function() {
      casper.open("public/index.html");
      casper.then(function() {
        casper.test.assertExists('#uploadimage');
      });
    })
    .given("the default settings are used", function() {
      casper.evaluate(function() {
        phantom.clearCookies();
      });
    })
    .given("the 181 colors are used", function() {
      casper.evaluate(function() {
        Cookies.set('newColors', '181');
      });
    })
    .given("the 112 colors are used", function() {
      casper.evaluate(function() {
        Cookies.set('newColors', '112');
      });
    })
    .given("the 116 colors are used", function() {
      casper.evaluate(function() {
        Cookies.set('newColors', '116');
      });
    })
    .when("I upload \"$an_image_file\"", function(an_image_file) {
      casper.fill('form', {
        'img': fs.workingDirectory + "/tests/casperjs/testdata/" + an_image_file
      }, false);
    })
    .then("I am able to split the image into $NUM horizontal and $NUM vertical parts", function(horizontal, vertical) {
      casper.waitUntilVisible('.step-2', function() {
        casper.test.assertElementCount('#number_horizontal option', parseInt(horizontal, 10));
        casper.test.assertElementCount('#number_vertical option', parseInt(vertical, 10));
      });
    })
    .when("I select $NUM horizontal and $NUM vertical part", function(horizontal, vertical) {
      casper.waitUntilVisible('.step-2', function() {
        casper.evaluate(function(horizontal, vertical) {
          $('#width_horizontal').val(horizontal).change();
          $('#width_vertical').val(vertical).change();
        });

        casper.click("#selectnumberofparts");
      });
    })
    .then("the canvas should have the hash code \"$hashcode\" in step $NUM", function(hashcode, step_num) {
      casper.waitUntilVisible('.step-' + step_num, function() {
        casper.scrollTo(0, 0);
        casper.test.assertEquals(casper.captureBase64('png', '#canvas').hashCode(), hashcode, 'canvas has correct content');
      });
    })
    .when("I click on \"$element_id\"", function(element) {
      casper.click("#" + element);
    })
    .when("I submit to create the map file on the server", function() {
      var old_function = casper.evaluate(function() {
        var old_function = $.post;
        $.post = function(url, data, callback) {
          window.casperTest_data = data;
          window.casperTest_url = url;
          callback('theFileName');
          return {'error': function() {}};
        };
        $.post._oldfunction = old_function;
        return old_function;
      });

      casper.click("#createfile");
    })
    .then("the map_item sent to the server should have the hash code \"$hashcode\"", function(hashcode) {
      var data = casper.evaluate(function() {
        return window.casperTest_data;
      });
      casper.test.assertEquals(data.map_item.hashCode(), hashcode, 'correct map-item array sent to server');
    })
    .then("the $data_item sent to the server should be '$value'", function(data_item, value) {
      var data = casper.evaluate(function() {
        return window.casperTest_data;
      });
      casper.test.assertEquals(data[data_item], value);
    });
};