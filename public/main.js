var ctx_full = document.getElementById('canvas_full').getContext('2d'),
    ctx = document.getElementById('canvas').getContext('2d'),
    canvas = document.getElementById('canvas'),
    canvas_full = document.getElementById('canvas_full'),
    img,
    original_img = document.getElementById('original_img'),
    url = window.URL || window.webkitURL,
    src;

function draw(ev) {
  var f = document.getElementById("uploadimage").files[0];
  img = new Image();
  src = url.createObjectURL(f);

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
  colourSpace = Cookies.get('colourSpace') || 'laba';
}

function selectnumber(ev) {
  map_parts_vertical = $('#number_vertical').val();
  map_parts_horizontal = $('#number_horizontal').val();

  var canvasCopy = document.createElement("canvas");
  var copyContext = canvasCopy.getContext("2d");
  var maxWidth = 128 * map_parts_horizontal, maxHeight = 128 * map_parts_vertical;

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
  if (!(x === map_parts_horizontal - 1 && y === map_parts_vertical - 1)) {
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
  var ctx = document.getElementById('canvas_full').getContext('2d');
  var pixelData = ctx.getImageData(0, 0, 128 * map_parts_horizontal, 128 * map_parts_vertical);
  var c;
  var index;
  var closestDistance, closestColorIndex, distance;
  var compareColors;
  all_maps_data = [];
  for (var i = 0; i < pixelData.data.length / 4; i++) {
    index = i * 4;
    c = new Colour( Colour.RGBA, [pixelData.data[index],
     pixelData.data[index + 1],
     pixelData.data[index + 2],
     pixelData.data[index + 3]] );

    if (colourSpace == 'laba') {
      c = c.convertTo(Colour.LABA);
      compareColors = minecraftcolors_laba;
    } else if (colourSpace == 'rgba') {
      compareColors = minecraftcolors;
    } else if (colourSpace == 'xyza') {
      c = c.convertTo(Colour.XYZA);
      compareColors = minecraftcolors_xyza;
    } else if (colourSpace == 'hsva') {
      c = c.convertTo(Colour.HSVA);
      compareColors = minecraftcolors_hsva;
    }
    
    closestDistance = Number.MAX_VALUE;
    for (var k = 0; k < minecraftcolors.length; k++) {
      distance = c.distanceTo(compareColors[k]);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestColorIndex = k;
      }
    }

    if (pixelData.data[index + 3] < 50) {
      closestColorIndex = 0;
    }

    pixelData.data[index] = minecraftcolors[closestColorIndex].values[0];
    pixelData.data[index + 1] = minecraftcolors[closestColorIndex].values[1];
    pixelData.data[index + 2] = minecraftcolors[closestColorIndex].values[2];
    pixelData.data[index + 3] = minecraftcolors[closestColorIndex].values[3];

    all_maps_data.push(closestColorIndex + 3);
    // console.log(c);
  }
  ctx.putImageData(pixelData, 0, 0);
  drawCanvas(map_x, map_y);
  $('.step-3').addClass('hidden');
  $('.step-4').removeClass('hidden');
}

function createfile(ev) {
  var xcenter = Cookies.get('xcenter') || '0';
  var zcenter = Cookies.get('zcenter') || '0';
  var dim = Cookies.get('dimension') || '0';

  var responses = [];
  var responses_count = 0;
  if (all_maps_data) {
    for (var i = 0; i < map_parts_horizontal; i++) {
      for (var j = 0; j < map_parts_vertical; j++) {
        map_item = [];
        for (var k = 0; k < 128; k++) {
          for (var l = 0; l < 128; l++) {
            map_item.push(all_maps_data[((j * map_parts_horizontal * 128 * 128) + i * 128) +
              l + map_parts_horizontal * 128 * k]);
          }
        }
        (function(){
          var x = i;
          var y = j;
          $.post('createfile', {
            map_item: JSON.stringify(map_item),
            x_center: xcenter,
            z_center: zcenter,
            dimension: dim
          }, function(data) {
            responses[y + map_parts_vertical * x] = data;
            responses_count++;
            if (responses_count === map_parts_horizontal * map_parts_vertical) {
              var response_text = "";
              for (var m = 0; m < responses.length; m++) {
                response_text+= responses[m] + " (map_" + m + ".dat)<br />";
              }
              $('#ajaxreply').html(response_text);
              $('.step-4').addClass('hidden');
              $('.step-5').removeClass('hidden');
            }
          });
        }());
      }
    }
  }
}

var minecraftcolors = [
  new Colour(Colour.RGBA, [255, 255, 255, 0]),
  new Colour(Colour.RGBA, [89, 125, 39, 255]),
  new Colour(Colour.RGBA, [109,153,48, 255]),
  new Colour(Colour.RGBA, [127,178,56, 255]),
  new Colour(Colour.RGBA, [109,153,48, 255]),
  new Colour(Colour.RGBA, [174,164,115, 255]),
  new Colour(Colour.RGBA, [213,201,140, 255]),
  new Colour(Colour.RGBA, [247,233,163, 255]),
  new Colour(Colour.RGBA, [213,201,140, 255]),
  new Colour(Colour.RGBA, [117,117,117, 255]),
  new Colour(Colour.RGBA, [144,144,144, 255]),
  new Colour(Colour.RGBA, [167,167,167, 255]),
  new Colour(Colour.RGBA, [144,144,144, 255]),
  new Colour(Colour.RGBA, [180,0,0, 255]),
  new Colour(Colour.RGBA, [220,0,0, 255]),
  new Colour(Colour.RGBA, [255,0,0, 255]),
  new Colour(Colour.RGBA, [220,0,0, 255]),
  new Colour(Colour.RGBA, [112,112,180, 255]),
  new Colour(Colour.RGBA, [138,138,220, 255]),
  new Colour(Colour.RGBA, [160,160,255, 255]),
  new Colour(Colour.RGBA, [138,138,220, 255]),
  new Colour(Colour.RGBA, [117,117,117, 255]),
  new Colour(Colour.RGBA, [144,144,144, 255]),
  new Colour(Colour.RGBA, [167,167,167, 255]),
  new Colour(Colour.RGBA, [144,144,144, 255]),
  new Colour(Colour.RGBA, [0,87,0, 255]),
  new Colour(Colour.RGBA, [0,106,0, 255]),
  new Colour(Colour.RGBA, [0,124,0, 255]),
  new Colour(Colour.RGBA, [0,106,0, 255]),
  new Colour(Colour.RGBA, [180,180,180, 255]),
  new Colour(Colour.RGBA, [220,220,220, 255]),
  new Colour(Colour.RGBA, [255,255,255, 255]),
  new Colour(Colour.RGBA, [220,220,220, 255]),
  new Colour(Colour.RGBA, [115,118,129, 255]),
  new Colour(Colour.RGBA, [141,144,158, 255]),
  new Colour(Colour.RGBA, [164,168,184, 255]),
  new Colour(Colour.RGBA, [141,144,158, 255]),
  new Colour(Colour.RGBA, [129,74,33, 255]),
  new Colour(Colour.RGBA, [157,91,40, 255]),
  new Colour(Colour.RGBA, [183,106,47, 255]),
  new Colour(Colour.RGBA, [157,91,40, 255]),
  new Colour(Colour.RGBA, [79,79,79, 255]),
  new Colour(Colour.RGBA, [96,96,96, 255]),
  new Colour(Colour.RGBA, [112,112,112, 255]),
  new Colour(Colour.RGBA, [96,96,96, 255]),
  new Colour(Colour.RGBA, [45,45,180, 255]),
  new Colour(Colour.RGBA, [55,55,220, 255]),
  new Colour(Colour.RGBA, [64,64,255, 255]),
  new Colour(Colour.RGBA, [55,55,220, 255]),
  new Colour(Colour.RGBA, [73,58,35, 255]),
  new Colour(Colour.RGBA, [89,71,43, 255]),
  new Colour(Colour.RGBA, [104,83,50, 255]),
  new Colour(Colour.RGBA, [89,71,43, 255])
];

var minecraftcolors_laba = [];
for (var i = 0; i < minecraftcolors.length; i++) {
  minecraftcolors_laba.push(minecraftcolors[i].convertTo(Colour.LABA));
}
var minecraftcolors_hsva = [];
for (var i = 0; i < minecraftcolors.length; i++) {
  minecraftcolors_hsva.push(minecraftcolors[i].convertTo(Colour.HSVA));
}
var minecraftcolors_xyza = [];
for (var i = 0; i < minecraftcolors.length; i++) {
  minecraftcolors_xyza.push(minecraftcolors[i].convertTo(Colour.XYZA));
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