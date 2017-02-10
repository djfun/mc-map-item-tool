document.getElementById("savesettings").addEventListener("click", savesettings, false);

$(document).ready(function() {
  var colourSpace = Cookies.get('colourSpace') || 'laba';
  var xcenter = Cookies.get('xcenter') || '0';
  var zcenter = Cookies.get('zcenter') || '0';
  var dim = Cookies.get('dimension') || '0';
  var newColors = Cookies.get('newColors') || '181';
  var dithering = Cookies.get('dithering') || 'no';
  var interpolation = Cookies.get('interpolation') || 'standard';
  var transparency = Cookies.get('transparency') || '50';

  $('#colorSpace').val(colourSpace);
  $('#x_center').val(xcenter);
  $('#z_center').val(zcenter);
  $('#dimension').val(dim);
  $('#newColors').val(newColors);
  $('#dithering').val(dithering);
  $('#interpolation').val(interpolation);
  $('#transparency').val(transparency);
  $('#transparency_label').val(transparency + '/255');

  $('#transparency').on("input change", function() {
    $('#transparency_label').val($('#transparency').val() + '/255');
  });
});

function savesettings(event) {
  var colourSpace = $('#colorSpace').val();
  var xcenter = $('#x_center').val();
  var zcenter = $('#z_center').val();
  var dim = $('#dimension').val();
  var newColors = $('#newColors').val();
  var dithering = $('#dithering').val();
  var interpolation = $('#interpolation').val();
  var transparency = $('#transparency').val();
  Cookies.set('colourSpace', colourSpace);
  Cookies.set('xcenter', xcenter);
  Cookies.set('zcenter', zcenter);
  Cookies.set('dimension', dim);
  Cookies.set('newColors', newColors);
  Cookies.set('dithering', dithering);
  Cookies.set('interpolation', interpolation);
  Cookies.set('transparency', transparency);
}