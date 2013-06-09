document.getElementById("savesettings").addEventListener("click", savesettings, false);

$(document).ready(function() {
  var colourSpace = Cookies.get('colourSpace') || 'laba';
  var xcenter = Cookies.get('xcenter') || '0';
  var zcenter = Cookies.get('zcenter') || '0';
  var dim = Cookies.get('dimension') || '0';

  $('#colorSpace').val(colourSpace);
  $('#x_center').val(xcenter);
  $('#z_center').val(zcenter);
  $('#dimension').val(dim);
});

function savesettings(event) {
  var colourSpace = $('#colorSpace').val();
  var xcenter = $('#x_center').val();
  var zcenter = $('#z_center').val();
  var dim = $('#dimension').val();
  Cookies.set('colourSpace', colourSpace);
  Cookies.set('xcenter', xcenter);
  Cookies.set('zcenter', zcenter);
  Cookies.set('dimension', dim);
}