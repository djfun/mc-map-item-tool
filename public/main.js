var ctx_full = document.getElementById('canvas_full').getContext('2d'),
  ctx = document.getElementById('canvas').getContext('2d'),
  canvas = document.getElementById('canvas'),
  canvas_full = document.getElementById('canvas_full'),
  img,
  original_img = document.getElementById('original_img'),
  url = window.URL || window.webkitURL,
  src,
  interpolation,
  selected_ratio,
  settings_string;

function draw(ev) {
  var f = document.getElementById("uploadimage").files[0];
  img = new Image();
  src = url.createObjectURL(f);

  interpolation = Cookies.get('interpolation') || 'standard';
  if (interpolation == 'nearest_neighbor') {
    $('#original_img').addClass('pixelated');
  }

  // list all settings from Cookies in span#list_settings
  list_settings();

  img.src = src;
  original_img.src = src;
  img.onload = function() {

    url.revokeObjectURL(src);

    // calculate possible numbers for next step
    var highest_number_vertical = img.height / 128;
    var highest_number_horizontal = img.width / 128;

    $('#number_vertical').html('<option>1</option>');
    $('#number_horizontal').html('<option>1</option>');

    var i = 0;
    for (i = 2; i <= highest_number_vertical; i++) {
      $('#number_vertical').append('<option>' + i + '</option>');
    }
    for (i = 2; i <= highest_number_horizontal; i++) {
      $('#number_horizontal').append('<option>' + i + '</option>');
    }

    $('.step-1').addClass('hidden');

    $('.step-0-image').removeClass('hidden');

    $('#title_hero').addClass('hidden');
    $('#contact_alert').addClass('hidden');

    $('#tabs a[href="#step1"]').click(function (e) {
      e.preventDefault();
      go_back_2_to_1();
    });

    $('#tabs a[href="#step3"]').parent().addClass('disabled');
    $('#tabs a[href="#step4"]').parent().addClass('disabled');
    $('#tabs a[href="#step5"]').parent().addClass('disabled');

    $('#tabs').removeClass('hidden');
    $('#tabs a[href="#step2"]').tab('show');
  };
}

function selectnumber(ev) {
  map_parts_vertical = $('#number_vertical').val();
  map_parts_horizontal = $('#number_horizontal').val();

  var canvasCopy = document.createElement("canvas");
  var copyContext = canvasCopy.getContext("2d");
  var maxWidth = 128 * map_parts_horizontal,
    maxHeight = 128 * map_parts_vertical;

  var ratio = 1;
  var spaceW = 0;
  var spaceH = 0;

  if (img.width > img.height) {
    ratio = maxWidth / img.width;
  } else {
    ratio = maxHeight / img.height;
  }

  canvasCopy.width = img.width;
  canvasCopy.height = img.height;
  copyContext.drawImage(img, 0, 0);

  spaceH = (maxHeight - (img.height * ratio)) / 2;
  spaceW = (maxWidth - (img.width * ratio)) / 2;

  canvas_full.width = 128 * map_parts_horizontal;
  canvas_full.height = 128 * map_parts_vertical;

  canvas_full.style.width = canvas_full.width * 2;
  canvas_full.style.height = canvas_full.height * 2;

  if (interpolation == 'nearest_neighbor') {
    ctx_full.mozImageSmoothingEnabled = false;
    ctx_full.webkitImageSmoothingEnabled = false;
    ctx_full.msImageSmoothingEnabled = false;
    ctx_full.imageSmoothingEnabled = false;
  } else {
    ctx_full.mozImageSmoothingEnabled = true;
    ctx_full.webkitImageSmoothingEnabled = true;
    ctx_full.msImageSmoothingEnabled = true;
    ctx_full.imageSmoothingEnabled = true;
  }

  ctx_full.drawImage(canvasCopy, 0, 0,
    canvasCopy.width, canvasCopy.height,
    spaceW, spaceH, img.width * ratio, img.height * ratio);

  var canvas_full_scaled = document.getElementById('canvas_full_scaled');
  var ctx_full_scaled = canvas_full_scaled.getContext('2d');
  ctx_full_scaled.clearRect(0, 0, canvas_full_scaled.width, canvas_full_scaled.height);

  selected_ratio = map_parts_horizontal / map_parts_vertical;
  if (map_parts_horizontal >= map_parts_vertical) {
    ctx_full_scaled.drawImage(canvas_full, 0, 0, 256, 256 * (1/selected_ratio));
  } else {
    ctx_full_scaled.drawImage(canvas_full, 0, 0, 256 * selected_ratio, 256);
  }


  // draw scaled version of ctx_full onto canvas#canvas_full_scaled
  // add part selection to span#list_settings

  settings_string += '<tr><td>Map parts horizontal</td><td>' + map_parts_horizontal + '</td></tr>';
  settings_string += '<tr><td>Map parts vertical</td><td>' + map_parts_vertical + '</td></tr>';
  $('#list_settings').html('<table style="margin-left: auto; margin-right: auto; width: 300px">' + settings_string + '</table>');

  drawCanvas(0, 0);
  map_x = 0;
  map_y = 0;
  $('.step-0-canvas').removeClass('hidden');

  $('#tabs a[href="#step2"]').click(function (e) {
    e.preventDefault();
    go_back_3_to_2();
  });

  $('#tabs a[href="#step3"]').parent().removeClass('disabled');

  $('#tabs a[href="#step3"]').tab('show');
}

function drawCanvas(x, y) {
  $('.prev-map').removeClass('hidden');
  $('.next-map').removeClass('hidden');

  canvas.height = 128;
  canvas.width = 128;
  $(canvas).width(canvas.width * 2);
  $(canvas).height(canvas.height * 2);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(canvas_full, 128 * x, 128 * y, 128, 128,
    0, 0, 128, 128);
  ctx.scale(4, 4);
  if (x === 0 && y === 0) {
    $('.prev-map').addClass('hidden');
  }
  if (x === map_parts_horizontal - 1 && y === map_parts_vertical - 1) {
    $('.next-map').addClass('hidden');
  }
}

function prevMap(ev) {
  ev.preventDefault();
  if (!(map_x === 0 && map_y === 0)) {
    if (map_x === 0) {
      map_y--;
      map_x = map_parts_horizontal - 1;
    } else {
      map_x--;
    }
  }
  drawCanvas(map_x, map_y);
}

function nextMap(ev) {
  ev.preventDefault();
  if (!(map_x === map_parts_horizontal - 1 && map_y === map_parts_vertical - 1)) {
    if (map_x === map_parts_horizontal - 1) {
      map_y++;
      map_x = 0;
    } else {
      map_x++;
    }
  }
  drawCanvas(map_x, map_y);
}

function reducecolors(ev) {
  $('#reducecolors').addClass('hidden');
  var ctx = document.getElementById('canvas_full').getContext('2d');
  var pixelData = ctx.getImageData(0, 0, 128 * map_parts_horizontal, 128 * map_parts_vertical);
  
  var worker = new Worker("reduce_colors_worker.js");

  worker.postMessage({pixelData: pixelData,
    new_colors: Cookies.get('newColors') || 'yes',
    colourSpace: Cookies.get('colourSpace') || 'laba',
    dithering: Cookies.get('dithering') || 'no'
  });

  var time_start = new Date();
  var duration = 0;

  worker.onmessage = function(oEvent) {
    if (oEvent.data.step == 'finished') {
      ctx.putImageData(oEvent.data.pixelData, 0, 0);
      all_maps_data = oEvent.data.all_maps_data;

      // redraw scaled and now color reduced version of ctx_full onto canvas#canvas_full_scaled
      var ctx_full_scaled = document.getElementById('canvas_full_scaled').getContext('2d');
      if (map_parts_horizontal >= map_parts_vertical) {
        ctx_full_scaled.drawImage(canvas_full, 0, 0, 256, 256 * (1/selected_ratio));
      } else {
        ctx_full_scaled.drawImage(canvas_full, 0, 0, 256 * selected_ratio, 256);
      }

      drawCanvas(map_x, map_y);
      $('#reducecolors').removeClass('hidden');

      $('#tabs a[href="#step2"]').off('click');
      $('#tabs a[href="#step3"]').off('click');
      $('#tabs a[href="#step2"]').click(function (e) {
        e.preventDefault();
        go_back_4_to_3();
        go_back_3_to_2();
      });
      $('#tabs a[href="#step3"]').click(function (e) {
        e.preventDefault();
        go_back_4_to_3();
      });

      $('#tabs a[href="#step4"]').parent().removeClass('disabled');

      $('#tabs a[href="#step4"]').tab('show');
      duration = Math.abs(time_start - new Date()) / 1000;
      $('#reducecolors_time').parent().removeClass('hidden');
      $('#reducecolors_time').html('Reducing colors took ' + duration + ' seconds.');
    } else if (oEvent.data.step == 'percentage') {
      $('#reducecolors_progress').html(oEvent.data.percentage + '% complete.');
    } else if (oEvent.data.step == 'debug') {
      console.log(oEvent.data.message);
    }
  };

}

function createfile(ev) {
  $('#reducecolors_time').parent().addClass('hidden');

  var time_start = new Date();

  var xcenter = Cookies.get('xcenter') || '0';
  var zcenter = Cookies.get('zcenter') || '0';
  var dim = Cookies.get('dimension') || '0';

  var mapnumber = parseInt($('#map_number').val(), 10) || 0;

  var randomid = "";
  if (map_parts_horizontal > 1 || map_parts_vertical > 1) {
    randomid = makerandomid();
  }

  var responses = [];
  var responses_count = 0;
  if (all_maps_data) {
    for (var i = 0; i < map_parts_horizontal; i++) {
      for (var j = 0; j < map_parts_vertical; j++) {
        map_item = [];
        var co;
        for (var k = 0; k < 128; k++) {
          for (var l = 0; l < 128; l++) {
            co = all_maps_data[((j * map_parts_horizontal * 128 * 128) + i * 128) +
              l + map_parts_horizontal * 128 * k];
            if (co > 127) {
              co = co - 256;
            }
            map_item.push(co);
          }
        }
        (function() {
          var x = i;
          var y = j;
          $.post('createfile', {
            map_item: JSON.stringify(map_item),
            x_center: xcenter,
            z_center: zcenter,
            dimension: dim,
            randomid: randomid
          }, function(data) {
            responses[y + map_parts_vertical * x] = data;
            responses_count++;
            updateResponse('zip_file_part', {done_count: responses_count, map_count: map_parts_horizontal * map_parts_vertical});
            if (responses_count === map_parts_horizontal * map_parts_vertical) {
              if (responses_count == 1) {
                updateResponse('single_file_finished', {filename: responses[0], mapnumber: mapnumber, time_start: time_start});
              } else {
                $.post('createzip', {
                  mapfiles: JSON.stringify(responses),
                  zipname: randomid,
                  mapnumber: mapnumber
                }, function(data) {
                  updateResponse('zip_file_finished', {filename: data, time_start: time_start});
                });
              }
            }
          }).error(function() {
            updateResponse('error');
          });
        }());
      }
    }
  }
}

function go_back_2_to_1() {
  window.location.reload(false);
}

function go_back_3_to_2() {
  $('.step-0-canvas').addClass('hidden');
  $('#tabs a[href="#step2"]').tab('show');
  $('#tabs a[href="#step3"]').parent().addClass('disabled');
  list_settings();
}

function go_back_4_to_3() {
  $('#reducecolors_time').parent().addClass('hidden');
  $('#reducecolors_time').html('');
  $('#reducecolors_progress').html('');
  $('#tabs a[href="#step4"]').parent().addClass('disabled');
  list_settings();
  selectnumber();
}

function go_back_5_to_4() {
  $('#ajaxreply').html('');
  $('#ajaxreply_time').parent().addClass('hidden');
  $('#ajaxreply_time').html('');
  $('#tabs a[href="#step4"]').tab('show');
  $('#tabs a[href="#step5"]').parent().addClass('disabled');
}

function updateResponse(step, data) {
  var response_text;

  if (step == 'single_file_finished') {
    response_text = '<a href="tmp/' + data['filename'] + '.dat?mapnumber=' +
        data['mapnumber'] + '">Download</a>' + " (map_" + data['mapnumber'] + ".dat)";
    $('#ajaxreply').html(response_text);
    duration = Math.abs(data.time_start - new Date()) / 1000;
    $('#ajaxreply_time').parent().removeClass('hidden');
    $('#ajaxreply_time').html('Creating map file took ' + duration + ' seconds.');
    $('#tabs a[href="#step5"]').tab('show');
  } else if (step == 'zip_file_finished') {
    console.log(data);
    response_text = '<a href="tmp/' + data['filename'] + '.zip">Download</a>' + " (Zip archive with map files)";
    $('#ajaxreply').html(response_text);
    duration = Math.abs(data.time_start - new Date()) / 1000;
    $('#ajaxreply_time').parent().removeClass('hidden');
    $('#ajaxreply_time').html('Creating map files took ' + duration + ' seconds.');
    $('#tabs a[href="#step5"]').tab('show');
  } else if (step == 'zip_file_part') {
    response_text = "Creating maps: " + data['done_count'] + " of " + data['map_count'] + " done.";
    $('#ajaxreply').html(response_text);
    $('#tabs a[href="#step5"]').tab('show');
  } else if (step == 'error') {
    response_text = "The server returned an error. If you think, this is a malfunction, please report it (via github, twitter, ..).";
    $('#ajaxreply').html(response_text);
    $('#instruction').addClass('hidden');
    $('#tabs a[href="#step5"]').tab('show');
  }
  $('#tabs a[href="#step2"]').off('click');
  $('#tabs a[href="#step3"]').off('click');
  $('#tabs a[href="#step4"]').off('click');
  $('#tabs a[href="#step2"]').click(function (e) {
    e.preventDefault();
    go_back_5_to_4();
    go_back_4_to_3();
    go_back_3_to_2();
  });
  $('#tabs a[href="#step3"]').click(function (e) {
    e.preventDefault();
    go_back_5_to_4();
    go_back_4_to_3();
  });
  $('#tabs a[href="#step4"]').click(function (e) {
    e.preventDefault();
    go_back_5_to_4();
  });

  $('#tabs a[href="#step5"]').parent().removeClass('disabled');
}

function list_settings() {
  var colorSchemeToText = {
    'no': 'Old colors',
    'yes': 'Version 1.7.2 (2013)',
    '181': 'Version 1.8.1 (2014)'
  };
  var dimensionToText = {
    '0': 'Overworld',
    '1': 'Nether',
    '2': 'End'
  };
  var ditheringToText = {
    'no': 'No dithering',
    'floydsteinberg': 'Floyd-Steinberg',
  };
  var interpolationToText = {
    'standard': 'Standard',
    'nearest_neighbor': 'Nearest Neighbor'
  };
  var sett_colorSpace = Cookies.get('colourSpace') || 'laba';
  var sett_colorScheme = colorSchemeToText[Cookies.get('newColors') || 'yes'];
  var sett_dithering = ditheringToText[Cookies.get('dithering') || 'no'];
  var sett_interpolation = interpolationToText[Cookies.get('interpolation') || 'standard'];
  var sett_xCenter = Cookies.get('xcenter') || '0';
  var sett_zCenter = Cookies.get('zcenter') || '0';
  var sett_dimension = dimensionToText[Cookies.get('dimension') || '0'];

  settings_string = '<tr><td>Color space</td><td>' + sett_colorSpace + '</td></tr>';
  settings_string += '<tr><td>Color scheme</td><td>' + sett_colorScheme + '</td></tr>';
  settings_string += '<tr><td>Dithering</td><td>' + sett_dithering + '</td></tr>';
  settings_string += '<tr><td>Interpolation</td><td>' + sett_interpolation + '</td></tr>';
  settings_string += '<tr><td>X Center</td><td>' + sett_xCenter + '</td></tr>';
  settings_string += '<tr><td>Z Center</td><td>' + sett_zCenter + '</td></tr>';
  settings_string += '<tr><td>Dimension</td><td>' + sett_dimension + '</td></tr>';
  $('#list_settings').html('<table style="margin-left: auto; margin-right: auto; width: 300px">' + settings_string + '</table>');
}


function makerandomid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

var map_item;
var map_parts_vertical;
var map_parts_horizontal;

var all_maps_data;

var map_x;
var map_y;

document.getElementById("uploadimage").addEventListener("change", draw, false);
document.getElementById("selectnumberofparts").addEventListener("click", selectnumber, false);
document.getElementById("reducecolors").addEventListener("click", reducecolors, false);
document.getElementById("createfile").addEventListener("click", createfile, false);

document.getElementById("prevmap").addEventListener("click", prevMap, false);
document.getElementById("nextmap").addEventListener("click", nextMap, false);

$(document).ready(function() {
  // console.log('dom ready');
  $('.step-0-image').addClass('hidden');
  $('.step-0-canvas').addClass('hidden');
  $('#reducecolors_time').parent().addClass('hidden');
  $('#ajaxreply_time').parent().addClass('hidden');
  $('#tabs').addClass('hidden');
});