document.getElementById("savesettings").addEventListener("click", savesettings, false);

$(document).ready(function() {
  var colourSpace = Cookies.get('colourSpace') || 'laba';
  var xcenter = Cookies.get('xcenter') || '0';
  var zcenter = Cookies.get('zcenter') || '0';
  var dim = Cookies.get('dimension') || '0';
  var newColors = Cookies.get('newColors') || 'no';

  $('#colorSpace').val(colourSpace);
  $('#x_center').val(xcenter);
  $('#z_center').val(zcenter);
  $('#dimension').val(dim);
  $('#newColors').val(newColors);
});

function savesettings(event) {
  var colourSpace = $('#colorSpace').val();
  var xcenter = $('#x_center').val();
  var zcenter = $('#z_center').val();
  var dim = $('#dimension').val();
  var newColors = $('#newColors').val();
  Cookies.set('colourSpace', colourSpace);
  Cookies.set('xcenter', xcenter);
  Cookies.set('zcenter', zcenter);
  Cookies.set('dimension', dim);
  Cookies.set('newColors', newColors);
}