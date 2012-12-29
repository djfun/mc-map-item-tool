document.getElementById("savesettings").addEventListener("click", savesettings, false);

$(document).ready(function() {
  var colourSpace = Cookies.get('colourSpace') || 'laba';

  $('#colorSpace').val(colourSpace);
});

function savesettings(event) {
  var colourSpace = $('#colorSpace').val();
  Cookies.set('colourSpace', colourSpace);
}