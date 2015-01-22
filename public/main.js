var ctx_full = document.getElementById('canvas_full').getContext('2d'),
  ctx = document.getElementById('canvas').getContext('2d'),
  canvas = document.getElementById('canvas'),
  canvas_full = document.getElementById('canvas_full'),
  img,
  original_img = document.getElementById('original_img'),
  url = window.URL || window.webkitURL,
  src,
  interpolation;

function draw(ev) {
  var f = document.getElementById("uploadimage").files[0];
  img = new Image();
  src = url.createObjectURL(f);

  interpolation = Cookies.get('interpolation') || 'standard';
  if (interpolation == 'nearest_neighbor') {
    $('#original_img').addClass('pixelated');
  }

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
    $('.step-2').removeClass('hidden');

    $('.step-0-image').removeClass('hidden');
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
  }

  ctx_full.drawImage(canvasCopy, 0, 0,
    canvasCopy.width, canvasCopy.height,
    spaceW, spaceH, img.width * ratio, img.height * ratio);

  drawCanvas(0, 0);
  map_x = 0;
  map_y = 0;
  $('.step-0-canvas').removeClass('hidden');
  $('.step-2').addClass('hidden');
  $('.step-3').removeClass('hidden');
}

function drawCanvas(x, y) {
  $('.prev-map').removeClass('hidden');
  $('.next-map').removeClass('hidden');

  canvas.height = 128;
  canvas.width = 128;
  canvas.style.width = canvas.width * 2;
  canvas.style.height = canvas.height * 2;
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

      drawCanvas(map_x, map_y);
      $('.step-3').addClass('hidden');
      $('#reducecolors').removeClass('hidden');
      $('.step-4').removeClass('hidden');
      duration = Math.abs(time_start - new Date()) / 1000;
      $('#reducecolors_time').html('Reducing colors took ' + duration + ' seconds.');
    } else if (oEvent.data.step == 'percentage') {
      $('#reducecolors_progress').html(oEvent.data.percentage + '% complete.');
    } else if (oEvent.data.step == 'debug') {
      console.log(oEvent.data.message);
    }
  };

}

function createfile(ev) {
  $('#reducecolors_time').addClass('hidden');

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

function updateResponse(step, data) {
  var response_text;

  if (step == 'single_file_finished') {
    response_text = '<a href="tmp/' + data['filename'] + '.dat?mapnumber=' +
        data['mapnumber'] + '">Download</a>' + " (map_" + data['mapnumber'] + ".dat)";
    $('#ajaxreply').html(response_text);
    duration = Math.abs(data.time_start - new Date()) / 1000;
    $('#ajaxreply_time').html('Creating map file took ' + duration + ' seconds.');
    $('.step-4').addClass('hidden');
    $('.step-5').removeClass('hidden');
  } else if (step == 'zip_file_finished') {
    console.log(data);
    response_text = '<a href="tmp/' + data['filename'] + '.zip">Download</a>' + " (Zip archive with map files)";
    $('#ajaxreply').html(response_text);
    duration = Math.abs(data.time_start - new Date()) / 1000;
    $('#ajaxreply_time').html('Creating map files took ' + duration + ' seconds.');
    $('.step-4').addClass('hidden');
    $('.step-5').removeClass('hidden');
  } else if (step == 'zip_file_part') {
    response_text = "Creating maps: " + data['done_count'] + " of " + data['map_count'] + " done.";
    $('#ajaxreply').html(response_text);
    $('.step-4').addClass('hidden');
    $('.step-5').removeClass('hidden');
  } else if (step == 'error') {
    response_text = "The server returned an error. If you think, this is a malfuntion, please report it (via github, twitter, ..).";
    $('#ajaxreply').html(response_text);
    $('.step-4').addClass('hidden');
    $('#instruction').addClass('hidden');
    $('.step-5').removeClass('hidden');
  }
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
  $('.step-2').addClass('hidden');
  $('.step-3').addClass('hidden');
  $('.step-4').addClass('hidden');
  $('.step-5').addClass('hidden');
});