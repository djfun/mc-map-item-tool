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
  var ctx = document.getElementById('canvas_full').getContext('2d');
  var pixelData = ctx.getImageData(0, 0, 128 * map_parts_horizontal, 128 * map_parts_vertical);
  var c;
  var index;
  var closestDistance, closestColorIndex, distance;
  var compareColors;
  var newColors = Cookies.get('newColors') || 'no';
  all_maps_data = [];
  for (var i = 0; i < pixelData.data.length / 4; i++) {
    index = i * 4;
    c = new Colour( Colour.RGBA, [pixelData.data[index],
     pixelData.data[index + 1],
     pixelData.data[index + 2],
     pixelData.data[index + 3]] );

    if (colourSpace == 'laba') {
      c = c.convertTo(Colour.LABA);
      compareColors = newColors == 'no' ? minecraftcolors_laba : minecraftcolors_new_laba;
    } else if (colourSpace == 'rgba') {
      compareColors = newColors == 'no' ? minecraftcolors : minecraftcolors_new;
    } else if (colourSpace == 'xyza') {
      c = c.convertTo(Colour.XYZA);
      compareColors = newColors == 'no' ? minecraftcolors_xyza : minecraftcolors_xyza;
    } else if (colourSpace == 'hsva') {
      c = c.convertTo(Colour.HSVA);
      compareColors = newColors == 'no' ? minecraftcolors_hsva : minecraftcolors_hsva;
    }
    
    closestDistance = Number.MAX_VALUE;
    var k = 0;
    if (newColors == 'no') {
      for (k = 1; k < minecraftcolors.length; k++) {
        distance = c.distanceTo(compareColors[k]);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestColorIndex = k;
        }
      }
    } else {
      for (k = 1; k < minecraftcolors_new.length; k++) {
        distance = c.distanceTo(compareColors[k]);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestColorIndex = k;
        }
      }
    }

    if (pixelData.data[index + 3] < 50) {
      closestColorIndex = 0;
    }

    if (newColors == 'no') {
      pixelData.data[index] = minecraftcolors_new[closestColorIndex].values[0];
      pixelData.data[index + 1] = minecraftcolors_new[closestColorIndex].values[1];
      pixelData.data[index + 2] = minecraftcolors_new[closestColorIndex].values[2];
      pixelData.data[index + 3] = minecraftcolors_new[closestColorIndex].values[3];
    } else {
      pixelData.data[index] = minecraftcolors_new[closestColorIndex].values[0];
      pixelData.data[index + 1] = minecraftcolors_new[closestColorIndex].values[1];
      pixelData.data[index + 2] = minecraftcolors_new[closestColorIndex].values[2];
      pixelData.data[index + 3] = minecraftcolors_new[closestColorIndex].values[3];
    }

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
        (function(){
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
            if (responses_count === map_parts_horizontal * map_parts_vertical) {
              var response_text = "";
              if (responses_count == 1) {
                response_text = '<a href="tmp/' + responses[0] + '.dat?mapnumber=' + mapnumber + '">Download</a>' + " (map_" + mapnumber + ".dat)";
                $('#ajaxreply').html(response_text);
                $('.step-4').addClass('hidden');
                $('.step-5').removeClass('hidden');
              } else {
                $.post('createzip', {
                  mapfiles: JSON.stringify(responses),
                  zipname: randomid,
                  mapnumber: mapnumber
                }, function (data) {
                  console.log(data);
                  response_text = '<a href="tmp/' + data + '.zip">Download</a>' + " (Zip archive with map files)";
                  $('#ajaxreply').html(response_text);
                  $('.step-4').addClass('hidden');
                  $('.step-5').removeClass('hidden');
                });
              }
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

var minecraftcolors_new = [
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
  new Colour(Colour.RGBA, [89,71,43, 255]),
  // NEW COLOURS FOR snapshot 13w42a
  new Colour(Colour.RGBA, [178, 178, 178, 255]),
  new Colour(Colour.RGBA, [220, 220, 220, 255]),
  new Colour(Colour.RGBA, [255, 255, 255, 255]),
  new Colour(Colour.RGBA, [220, 220, 220, 255]),
  new Colour(Colour.RGBA, [150, 88, 36, 255]),
  new Colour(Colour.RGBA, [184, 108, 43, 255]),
  new Colour(Colour.RGBA, [213, 126, 50, 255]),
  new Colour(Colour.RGBA, [184, 108, 43, 255]),
  new Colour(Colour.RGBA, [124, 52, 150, 255]),
  new Colour(Colour.RGBA, [151, 64, 184, 255]),
  new Colour(Colour.RGBA, [176, 75, 213, 255]),
  new Colour(Colour.RGBA, [151, 64, 184, 255]),
  new Colour(Colour.RGBA, [71, 107, 150, 255]),
  new Colour(Colour.RGBA, [87, 130, 184, 255]),
  new Colour(Colour.RGBA, [101, 151, 213, 255]),
  new Colour(Colour.RGBA, [87, 130, 184, 255]),
  new Colour(Colour.RGBA, [159, 159, 36, 255]),
  new Colour(Colour.RGBA, [195, 195, 43, 255]),
  new Colour(Colour.RGBA, [226, 226, 50, 255]),
  new Colour(Colour.RGBA, [195, 195, 43, 255]),
  new Colour(Colour.RGBA, [88, 142, 17, 255]),
  new Colour(Colour.RGBA, [108, 174, 21, 255]),
  new Colour(Colour.RGBA, [126, 202, 25, 255]),
  new Colour(Colour.RGBA, [108, 174, 21, 255]),
  new Colour(Colour.RGBA, [168, 88, 115, 255]),
  new Colour(Colour.RGBA, [206, 108, 140, 255]),
  new Colour(Colour.RGBA, [239, 126, 163, 255]),
  new Colour(Colour.RGBA, [206, 108, 140, 255]),
  new Colour(Colour.RGBA, [52, 52, 52, 255]),
  new Colour(Colour.RGBA, [64, 64, 64, 255]),
  new Colour(Colour.RGBA, [75, 75, 75, 255]),
  new Colour(Colour.RGBA, [64, 64, 64, 255]),
  new Colour(Colour.RGBA, [107, 107, 107, 255]),
  new Colour(Colour.RGBA, [130, 130, 130, 255]),
  new Colour(Colour.RGBA, [151, 151, 151, 255]),
  new Colour(Colour.RGBA, [130, 130, 130, 255]),
  new Colour(Colour.RGBA, [52, 88, 107, 255]),
  new Colour(Colour.RGBA, [64, 108, 130, 255]),
  new Colour(Colour.RGBA, [75, 126, 151, 255]),
  new Colour(Colour.RGBA, [64, 108, 130, 255]),
  new Colour(Colour.RGBA, [88, 43, 124, 255]),
  new Colour(Colour.RGBA, [108, 53, 151, 255]),
  new Colour(Colour.RGBA, [126, 62, 176, 255]),
  new Colour(Colour.RGBA, [108, 53, 151, 255]),
  new Colour(Colour.RGBA, [36, 52, 124, 255]),
  new Colour(Colour.RGBA, [43, 64, 151, 255]),
  new Colour(Colour.RGBA, [50, 75, 176, 255]),
  new Colour(Colour.RGBA, [43, 64, 151, 255]),
  new Colour(Colour.RGBA, [71, 52, 36, 255]),
  new Colour(Colour.RGBA, [87, 64, 43, 255]),
  new Colour(Colour.RGBA, [101, 75, 50, 255]),
  new Colour(Colour.RGBA, [87, 64, 43, 255]),
  new Colour(Colour.RGBA, [71, 88, 36, 255]),
  new Colour(Colour.RGBA, [87, 108, 43, 255]),
  new Colour(Colour.RGBA, [101, 126, 50, 255]),
  new Colour(Colour.RGBA, [87, 108, 43, 255]),
  new Colour(Colour.RGBA, [107, 36, 36, 255]),
  new Colour(Colour.RGBA, [130, 43, 43, 255]),
  new Colour(Colour.RGBA, [151, 50, 50, 255]),
  new Colour(Colour.RGBA, [130, 43, 43, 255]),
  new Colour(Colour.RGBA, [17, 17, 17, 255]),
  new Colour(Colour.RGBA, [21, 21, 21, 255]),
  new Colour(Colour.RGBA, [25, 25, 25, 255]),
  new Colour(Colour.RGBA, [21, 21, 21, 255]),
  new Colour(Colour.RGBA, [174, 166, 53, 255]),
  new Colour(Colour.RGBA, [212, 203, 65, 255]),
  new Colour(Colour.RGBA, [247, 235, 76, 255]),
  new Colour(Colour.RGBA, [212, 203, 65, 255]),
  new Colour(Colour.RGBA, [63, 152, 148, 255]),
  new Colour(Colour.RGBA, [78, 186, 181, 255]),
  new Colour(Colour.RGBA, [91, 216, 210, 255]),
  new Colour(Colour.RGBA, [78, 186, 181, 255]),
  new Colour(Colour.RGBA, [52, 90, 180, 255]),
  new Colour(Colour.RGBA, [63, 110, 220, 255]),
  new Colour(Colour.RGBA, [74, 128, 255, 255]),
  new Colour(Colour.RGBA, [63, 110, 220, 255]),
  new Colour(Colour.RGBA, [0, 153, 40, 255]),
  new Colour(Colour.RGBA, [0, 187, 50, 255]),
  new Colour(Colour.RGBA, [0, 217, 58, 255]),
  new Colour(Colour.RGBA, [0, 187, 50, 255]),
  new Colour(Colour.RGBA, [14, 14, 21, 255]),
  new Colour(Colour.RGBA, [18, 17, 26, 255]),
  new Colour(Colour.RGBA, [21, 20, 31, 255]),
  new Colour(Colour.RGBA, [18, 17, 26, 255]),
  new Colour(Colour.RGBA, [79, 1, 0, 255]),
  new Colour(Colour.RGBA, [96, 1, 0, 255]),
  new Colour(Colour.RGBA, [112, 2, 0, 255]),
  new Colour(Colour.RGBA, [96, 1, 0, 255])
];

var minecraftcolors_new_laba = [];
for (var i = 0; i < minecraftcolors_new.length; i++) {
  minecraftcolors_new_laba.push(minecraftcolors_new[i].convertTo(Colour.LABA));
}
var minecraftcolors_new_hsva = [];
for (var i = 0; i < minecraftcolors_new.length; i++) {
  minecraftcolors_new_hsva.push(minecraftcolors_new[i].convertTo(Colour.HSVA));
}
var minecraftcolors_new_xyza = [];
for (var i = 0; i < minecraftcolors_new.length; i++) {
  minecraftcolors_new_xyza.push(minecraftcolors_new[i].convertTo(Colour.XYZA));
}

function makerandomid()
{
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 10; i++ )
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


