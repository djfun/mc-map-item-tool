function draw(ev) {
  var ctx = document.getElementById('canvas').getContext('2d'),
    img = new Image(),
    f = document.getElementById("uploadimage").files[0],
    url = window.URL || window.webkitURL,
    src = url.createObjectURL(f);

  ctx.scale(4, 4);

  var canvasCopy = document.createElement("canvas");
  var copyContext = canvasCopy.getContext("2d");
  var maxWidth = 128, maxHeight = 128;

  img.src = src;
  img.onload = function() {

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

    canvas.width = 128;
    canvas.height = 128;

    canvas.style.width = canvas.width * 2;
    canvas.style.height = canvas.height * 2;

    ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, spaceW, spaceH, img.width * ratio, img.height * ratio);

    url.revokeObjectURL(src);
    $('.step-1').addClass('hidden');
    $('.step-2').removeClass('hidden');
  };
}

function reducecolors(ev) {
  var ctx = document.getElementById('canvas').getContext('2d');
  var pixelData = ctx.getImageData(0, 0, 128, 128);
  var c;
  var index;
  var closestDistance, closestColorIndex, distance;
  map_item = [];
  for (var i = 0; i < pixelData.data.length / 4; i++) {
    index = i * 4;
    c = new Colour( Colour.RGBA, [pixelData.data[index],
     pixelData.data[index + 1],
     pixelData.data[index + 2],
     pixelData.data[index + 3]] ).convertTo(Colour.LABA);
    closestDistance = Number.MAX_VALUE;
    for (var k = 0; k < minecraftcolors.length; k++) {
      distance = c.distanceTo(minecraftcolors_laba[k]);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestColorIndex = k;
      }
    }
    pixelData.data[index] = minecraftcolors[closestColorIndex].values[0];
    pixelData.data[index + 1] = minecraftcolors[closestColorIndex].values[1];
    pixelData.data[index + 2] = minecraftcolors[closestColorIndex].values[2];
    pixelData.data[index + 3] = minecraftcolors[closestColorIndex].values[3];

    map_item.push(closestColorIndex + 4);
    // console.log(c);
  }
  ctx.putImageData(pixelData, 0, 0);
  $('.step-2').addClass('hidden');
  $('.step-3').removeClass('hidden');
}

function createfile(ev) {
  if (map_item) {
    $.post('createfile', {
      map_item: JSON.stringify(map_item)
    }, function(data) {
      $('#ajaxreply').html(data);
      $('.step-3').addClass('hidden');
      $('.step-4').removeClass('hidden');
    });
  }
}

var minecraftcolors = [
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

var map_item;

document.getElementById("uploadimage").addEventListener("change", draw, false);
document.getElementById("reducecolors").addEventListener("click", reducecolors, false);
document.getElementById("createfile").addEventListener("click", createfile, false);

$(document).ready(function() {
  // console.log('dom ready');
  $('.step-2').addClass('hidden');
  $('.step-3').addClass('hidden');
  $('.step-4').addClass('hidden');
});