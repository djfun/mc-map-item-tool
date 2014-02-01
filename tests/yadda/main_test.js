var fs = require('fs');
var async = require(fs.workingDirectory + '/node_modules/async/lib/async');
var Yadda = require(fs.workingDirectory + '/node_modules/yadda/lib/index');
var xpath = require('casper').selectXPath;

var English = Yadda.localisation.English;

var parser = new Yadda.parsers.FeatureParser();
var library = require(fs.workingDirectory + '/tests/yadda/main_steps').init();
var yadda = new Yadda.Yadda(library);
Yadda.plugins.casper(yadda, casper);

new Yadda.FeatureFileSearch(fs.workingDirectory + '/tests/yadda/features').each(function(file) {
  console.log(file);
    var feature = parser.parse(fs.read(file));

    casper.test.begin(feature.title, function suite(test) {
        async.eachSeries(feature.scenarios, function(scenario, next) {
            casper.start();
            console.log("");
            casper.test.info(scenario.title);
            console.log("");
            casper.yadda(scenario.steps);
            casper.run(function() {
                next();
            });
        }, function(err) {
            casper.test.done();
        });
    });

});