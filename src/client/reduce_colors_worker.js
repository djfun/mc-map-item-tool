importScripts("js/Colour.js");

var all_maps_data;
var colourSpace;
var dithering;

onmessage = function (oEvent) {
  load_colors(oEvent.data.new_colors);
  var pixelData = oEvent.data.pixelData;
  colourSpace = oEvent.data.colourSpace;
  dithering = oEvent.data.dithering;
  transparencyThreshold = parseInt(oEvent.data.transparency, 10);

  all_maps_data = [];
  var index;

  var l = pixelData.data.length / 4;

  var percentage_done = 0;
  var percentage_done_last = 0;

  for (var i = 0; i < pixelData.data.length / 4; i++) {
    index = i * 4;
    reduce_colors_map(index, index + 1, index + 2, index + 3, pixelData);

    percentage_done = Math.floor(i / l * 100);
    if (percentage_done > percentage_done_last + 1) {
      postMessage({step: 'percentage', percentage: percentage_done});
      percentage_done_last = percentage_done;
    }
  }

  postMessage({step: 'finished', pixelData: pixelData, all_maps_data: all_maps_data});
};


function reduce_colors_map(a, b, c, d, pixelData) {
  var closestDistance, closestColorIndex, distance;
  var compareColors;

  var color = new Colour(Colour.RGBA, [pixelData.data[a],
    pixelData.data[b],
    pixelData.data[c],
    pixelData.data[d]
  ]);

  var old_a = pixelData.data[a];
  var old_b = pixelData.data[b];
  var old_c = pixelData.data[c];
  var old_d = pixelData.data[d];

  if (colourSpace == 'laba') {
    color = color.convertTo(Colour.LABA);
    compareColors = minecraftcolors_laba;
  } else if (colourSpace == 'rgba') {
    compareColors = minecraftcolors;
  } else if (colourSpace == 'xyza') {
    color = color.convertTo(Colour.XYZA);
    compareColors = minecraftcolors_xyza;
  } else if (colourSpace == 'hsva') {
    color = color.convertTo(Colour.HSVA);
    compareColors = minecraftcolors_hsva;
  }

  closestDistance = Number.MAX_VALUE;
  var k = 0;
  for (k = 1; k < minecraftcolors.length; k++) {
    distance = color.distanceTo(compareColors[k]);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestColorIndex = k;
    }
  }

  if (pixelData.data[d] < transparencyThreshold) {
    closestColorIndex = 0;
  }

  pixelData.data[a] = minecraftcolors[closestColorIndex].values[0];
  pixelData.data[b] = minecraftcolors[closestColorIndex].values[1];
  pixelData.data[c] = minecraftcolors[closestColorIndex].values[2];
  pixelData.data[d] = minecraftcolors[closestColorIndex].values[3];

  all_maps_data.push(closestColorIndex + 3);

  if (dithering == 'floydsteinberg') {
    floyd_steinberg(a, b, c, d, pixelData, old_a, old_b, old_c, old_d);
  }
}


function floyd_steinberg(a, b, c, d, pixelData, old_a, old_b, old_c, old_d) {
  var quant_error_a = old_a - pixelData.data[a];
  var quant_error_b = old_b - pixelData.data[b];
  var quant_error_c = old_c - pixelData.data[c];
  var quant_error_d = old_d - pixelData.data[d];
  quant_error_a *= 0.4;
  quant_error_b *= 0.4;
  quant_error_c *= 0.4;
  quant_error_d *= 0.4;

  var width = pixelData.width * 4;

  // [x+1][y  ]
  if (d + 4 <= pixelData.data.length && d % width < width - 1) {
    pixelData.data[a + 4] = pixelData.data[a + 4] + quant_error_a * 7 / 16;
    pixelData.data[b + 4] = pixelData.data[b + 4] + quant_error_b * 7 / 16;
    pixelData.data[c + 4] = pixelData.data[c + 4] + quant_error_c * 7 / 16;
    pixelData.data[d + 4] = pixelData.data[d + 4] + quant_error_d * 7 / 16;
  }

  // [x-1][y+1]
  if (d + width <= pixelData.data.length && d % width > 0) {
    pixelData.data[a - 4 + width] = pixelData.data[a - 4 + width] + quant_error_a * 3 / 16;
    pixelData.data[b - 4 + width] = pixelData.data[b - 4 + width] + quant_error_b * 3 / 16;
    pixelData.data[c - 4 + width] = pixelData.data[c - 4 + width] + quant_error_c * 3 / 16;
    pixelData.data[d - 4 + width] = pixelData.data[d - 4 + width] + quant_error_d * 3 / 16;
  }

  // [x  ][y+1]
  if (d + width <= pixelData.data.length) {
    pixelData.data[a + width] = pixelData.data[a + width] + quant_error_a * 5 / 16;
    pixelData.data[b + width] = pixelData.data[b + width] + quant_error_b * 5 / 16;
    pixelData.data[c + width] = pixelData.data[c + width] + quant_error_c * 5 / 16;
    pixelData.data[d + width] = pixelData.data[d + width] + quant_error_d * 5 / 16;
  }

  // [x+1][y+1]
  if (d + width <= pixelData.data.length && d % width < width - 1) {
    pixelData.data[a + 4 + width] = pixelData.data[a + 4 + width] + quant_error_a * 1 / 16;
    pixelData.data[b + 4 + width] = pixelData.data[b + 4 + width] + quant_error_b * 1 / 16;
    pixelData.data[c + 4 + width] = pixelData.data[c + 4 + width] + quant_error_c * 1 / 16;
    pixelData.data[d + 4 + width] = pixelData.data[d + 4 + width] + quant_error_d * 1 / 16;
  }
}

var minecraftcolors, minecraftcolors_laba, minecraftcolors_hsva, minecraftcolors_xyza;

function load_colors(new_colors) {

  if (new_colors == 'no') {
    minecraftcolors = [
      new Colour(Colour.RGBA, [255, 255, 255, 0]),
      new Colour(Colour.RGBA, [89, 125, 39, 255]),
      new Colour(Colour.RGBA, [109, 153, 48, 255]),
      new Colour(Colour.RGBA, [127, 178, 56, 255]),
      new Colour(Colour.RGBA, [109, 153, 48, 255]),
      new Colour(Colour.RGBA, [174, 164, 115, 255]),
      new Colour(Colour.RGBA, [213, 201, 140, 255]),
      new Colour(Colour.RGBA, [247, 233, 163, 255]),
      new Colour(Colour.RGBA, [213, 201, 140, 255]),
      new Colour(Colour.RGBA, [117, 117, 117, 255]),
      new Colour(Colour.RGBA, [144, 144, 144, 255]),
      new Colour(Colour.RGBA, [167, 167, 167, 255]),
      new Colour(Colour.RGBA, [144, 144, 144, 255]),
      new Colour(Colour.RGBA, [180, 0, 0, 255]),
      new Colour(Colour.RGBA, [220, 0, 0, 255]),
      new Colour(Colour.RGBA, [255, 0, 0, 255]),
      new Colour(Colour.RGBA, [220, 0, 0, 255]),
      new Colour(Colour.RGBA, [112, 112, 180, 255]),
      new Colour(Colour.RGBA, [138, 138, 220, 255]),
      new Colour(Colour.RGBA, [160, 160, 255, 255]),
      new Colour(Colour.RGBA, [138, 138, 220, 255]),
      new Colour(Colour.RGBA, [117, 117, 117, 255]),
      new Colour(Colour.RGBA, [144, 144, 144, 255]),
      new Colour(Colour.RGBA, [167, 167, 167, 255]),
      new Colour(Colour.RGBA, [144, 144, 144, 255]),
      new Colour(Colour.RGBA, [0, 87, 0, 255]),
      new Colour(Colour.RGBA, [0, 106, 0, 255]),
      new Colour(Colour.RGBA, [0, 124, 0, 255]),
      new Colour(Colour.RGBA, [0, 106, 0, 255]),
      new Colour(Colour.RGBA, [180, 180, 180, 255]),
      new Colour(Colour.RGBA, [220, 220, 220, 255]),
      new Colour(Colour.RGBA, [255, 255, 255, 255]),
      new Colour(Colour.RGBA, [220, 220, 220, 255]),
      new Colour(Colour.RGBA, [115, 118, 129, 255]),
      new Colour(Colour.RGBA, [141, 144, 158, 255]),
      new Colour(Colour.RGBA, [164, 168, 184, 255]),
      new Colour(Colour.RGBA, [141, 144, 158, 255]),
      new Colour(Colour.RGBA, [129, 74, 33, 255]),
      new Colour(Colour.RGBA, [157, 91, 40, 255]),
      new Colour(Colour.RGBA, [183, 106, 47, 255]),
      new Colour(Colour.RGBA, [157, 91, 40, 255]),
      new Colour(Colour.RGBA, [79, 79, 79, 255]),
      new Colour(Colour.RGBA, [96, 96, 96, 255]),
      new Colour(Colour.RGBA, [112, 112, 112, 255]),
      new Colour(Colour.RGBA, [96, 96, 96, 255]),
      new Colour(Colour.RGBA, [45, 45, 180, 255]),
      new Colour(Colour.RGBA, [55, 55, 220, 255]),
      new Colour(Colour.RGBA, [64, 64, 255, 255]),
      new Colour(Colour.RGBA, [55, 55, 220, 255]),
      new Colour(Colour.RGBA, [73, 58, 35, 255]),
      new Colour(Colour.RGBA, [89, 71, 43, 255]),
      new Colour(Colour.RGBA, [104, 83, 50, 255]),
      new Colour(Colour.RGBA, [89, 71, 43, 255])
    ];

  } else if (new_colors == 'yes') {
    minecraftcolors = [
      new Colour(Colour.RGBA, [255, 255, 255, 0]),
      new Colour(Colour.RGBA, [89, 125, 39, 255]),
      new Colour(Colour.RGBA, [109, 153, 48, 255]),
      new Colour(Colour.RGBA, [127, 178, 56, 255]),
      new Colour(Colour.RGBA, [109, 153, 48, 255]),
      new Colour(Colour.RGBA, [174, 164, 115, 255]),
      new Colour(Colour.RGBA, [213, 201, 140, 255]),
      new Colour(Colour.RGBA, [247, 233, 163, 255]),
      new Colour(Colour.RGBA, [213, 201, 140, 255]),
      new Colour(Colour.RGBA, [117, 117, 117, 255]),
      new Colour(Colour.RGBA, [144, 144, 144, 255]),
      new Colour(Colour.RGBA, [167, 167, 167, 255]),
      new Colour(Colour.RGBA, [144, 144, 144, 255]),
      new Colour(Colour.RGBA, [180, 0, 0, 255]),
      new Colour(Colour.RGBA, [220, 0, 0, 255]),
      new Colour(Colour.RGBA, [255, 0, 0, 255]),
      new Colour(Colour.RGBA, [220, 0, 0, 255]),
      new Colour(Colour.RGBA, [112, 112, 180, 255]),
      new Colour(Colour.RGBA, [138, 138, 220, 255]),
      new Colour(Colour.RGBA, [160, 160, 255, 255]),
      new Colour(Colour.RGBA, [138, 138, 220, 255]),
      new Colour(Colour.RGBA, [117, 117, 117, 255]),
      new Colour(Colour.RGBA, [144, 144, 144, 255]),
      new Colour(Colour.RGBA, [167, 167, 167, 255]),
      new Colour(Colour.RGBA, [144, 144, 144, 255]),
      new Colour(Colour.RGBA, [0, 87, 0, 255]),
      new Colour(Colour.RGBA, [0, 106, 0, 255]),
      new Colour(Colour.RGBA, [0, 124, 0, 255]),
      new Colour(Colour.RGBA, [0, 106, 0, 255]),
      new Colour(Colour.RGBA, [180, 180, 180, 255]),
      new Colour(Colour.RGBA, [220, 220, 220, 255]),
      new Colour(Colour.RGBA, [255, 255, 255, 255]),
      new Colour(Colour.RGBA, [220, 220, 220, 255]),
      new Colour(Colour.RGBA, [115, 118, 129, 255]),
      new Colour(Colour.RGBA, [141, 144, 158, 255]),
      new Colour(Colour.RGBA, [164, 168, 184, 255]),
      new Colour(Colour.RGBA, [141, 144, 158, 255]),
      new Colour(Colour.RGBA, [129, 74, 33, 255]),
      new Colour(Colour.RGBA, [157, 91, 40, 255]),
      new Colour(Colour.RGBA, [183, 106, 47, 255]),
      new Colour(Colour.RGBA, [157, 91, 40, 255]),
      new Colour(Colour.RGBA, [79, 79, 79, 255]),
      new Colour(Colour.RGBA, [96, 96, 96, 255]),
      new Colour(Colour.RGBA, [112, 112, 112, 255]),
      new Colour(Colour.RGBA, [96, 96, 96, 255]),
      new Colour(Colour.RGBA, [45, 45, 180, 255]),
      new Colour(Colour.RGBA, [55, 55, 220, 255]),
      new Colour(Colour.RGBA, [64, 64, 255, 255]),
      new Colour(Colour.RGBA, [55, 55, 220, 255]),
      new Colour(Colour.RGBA, [73, 58, 35, 255]),
      new Colour(Colour.RGBA, [89, 71, 43, 255]),
      new Colour(Colour.RGBA, [104, 83, 50, 255]),
      new Colour(Colour.RGBA, [89, 71, 43, 255]),
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
  } else if (new_colors == '181') {
    minecraftcolors = [
      new Colour(Colour.RGBA, [255, 255, 255, 0]),
      new Colour(Colour.RGBA, [89, 125, 39, 255]),
      new Colour(Colour.RGBA, [109, 153, 48, 255]),
      new Colour(Colour.RGBA, [127, 178, 56, 255]),
      new Colour(Colour.RGBA, [67, 94, 29, 255]),
      new Colour(Colour.RGBA, [174, 164, 115, 255]),
      new Colour(Colour.RGBA, [213, 201, 140, 255]),
      new Colour(Colour.RGBA, [247, 233, 163, 255]),
      new Colour(Colour.RGBA, [130, 123, 86, 255]),
      new Colour(Colour.RGBA, [140, 140, 140, 255]),
      new Colour(Colour.RGBA, [171, 171, 171, 255]),
      new Colour(Colour.RGBA, [199, 199, 199, 255]),
      new Colour(Colour.RGBA, [105, 105, 105, 255]),
      new Colour(Colour.RGBA, [180, 0, 0, 255]),
      new Colour(Colour.RGBA, [220, 0, 0, 255]),
      new Colour(Colour.RGBA, [255, 0, 0, 255]),
      new Colour(Colour.RGBA, [135, 0, 0, 255]),
      new Colour(Colour.RGBA, [112, 112, 180, 255]),
      new Colour(Colour.RGBA, [138, 138, 220, 255]),
      new Colour(Colour.RGBA, [160, 160, 255, 255]),
      new Colour(Colour.RGBA, [84, 84, 135, 255]),
      new Colour(Colour.RGBA, [117, 117, 117, 255]),
      new Colour(Colour.RGBA, [144, 144, 144, 255]),
      new Colour(Colour.RGBA, [167, 167, 167, 255]),
      new Colour(Colour.RGBA, [88, 88, 88, 255]),
      new Colour(Colour.RGBA, [0, 87, 0, 255]),
      new Colour(Colour.RGBA, [0, 106, 0, 255]),
      new Colour(Colour.RGBA, [0, 124, 0, 255]),
      new Colour(Colour.RGBA, [0, 65, 0, 255]),
      new Colour(Colour.RGBA, [180, 180, 180, 255]),
      new Colour(Colour.RGBA, [220, 220, 220, 255]),
      new Colour(Colour.RGBA, [255, 255, 255, 255]),
      new Colour(Colour.RGBA, [135, 135, 135, 255]),
      new Colour(Colour.RGBA, [115, 118, 129, 255]),
      new Colour(Colour.RGBA, [141, 144, 158, 255]),
      new Colour(Colour.RGBA, [164, 168, 184, 255]),
      new Colour(Colour.RGBA, [86, 88, 97, 255]),
      new Colour(Colour.RGBA, [106, 76, 54, 255]),
      new Colour(Colour.RGBA, [130, 94, 66, 255]),
      new Colour(Colour.RGBA, [151, 109, 77, 255]),
      new Colour(Colour.RGBA, [79, 57, 40, 255]),
      new Colour(Colour.RGBA, [79, 79, 79, 255]),
      new Colour(Colour.RGBA, [96, 96, 96, 255]),
      new Colour(Colour.RGBA, [112, 112, 112, 255]),
      new Colour(Colour.RGBA, [59, 59, 59, 255]),
      new Colour(Colour.RGBA, [45, 45, 180, 255]),
      new Colour(Colour.RGBA, [55, 55, 220, 255]),
      new Colour(Colour.RGBA, [64, 64, 255, 255]),
      new Colour(Colour.RGBA, [33, 33, 135, 255]),
      new Colour(Colour.RGBA, [100, 84, 50, 255]),
      new Colour(Colour.RGBA, [123, 102, 62, 255]),
      new Colour(Colour.RGBA, [143, 119, 72, 255]),
      new Colour(Colour.RGBA, [75, 63, 38, 255]),
      new Colour(Colour.RGBA, [180, 177, 172, 255]),
      new Colour(Colour.RGBA, [220, 217, 211, 255]),
      new Colour(Colour.RGBA, [255, 252, 245, 255]),
      new Colour(Colour.RGBA, [135, 133, 129, 255]),
      new Colour(Colour.RGBA, [152, 89, 36, 255]),
      new Colour(Colour.RGBA, [186, 109, 44, 255]),
      new Colour(Colour.RGBA, [216, 127, 51, 255]),
      new Colour(Colour.RGBA, [114, 67, 27, 255]),
      new Colour(Colour.RGBA, [125, 53, 152, 255]),
      new Colour(Colour.RGBA, [153, 65, 186, 255]),
      new Colour(Colour.RGBA, [178, 76, 216, 255]),
      new Colour(Colour.RGBA, [94, 40, 114, 255]),
      new Colour(Colour.RGBA, [72, 108, 152, 255]),
      new Colour(Colour.RGBA, [88, 132, 186, 255]),
      new Colour(Colour.RGBA, [102, 153, 216, 255]),
      new Colour(Colour.RGBA, [54, 81, 114, 255]),
      new Colour(Colour.RGBA, [161, 161, 36, 255]),
      new Colour(Colour.RGBA, [197, 197, 44, 255]),
      new Colour(Colour.RGBA, [229, 229, 51, 255]),
      new Colour(Colour.RGBA, [121, 121, 27, 255]),
      new Colour(Colour.RGBA, [89, 144, 17, 255]),
      new Colour(Colour.RGBA, [109, 176, 21, 255]),
      new Colour(Colour.RGBA, [127, 204, 25, 255]),
      new Colour(Colour.RGBA, [67, 108, 13, 255]),
      new Colour(Colour.RGBA, [170, 89, 116, 255]),
      new Colour(Colour.RGBA, [208, 109, 142, 255]),
      new Colour(Colour.RGBA, [242, 127, 165, 255]),
      new Colour(Colour.RGBA, [128, 67, 87, 255]),
      new Colour(Colour.RGBA, [53, 53, 53, 255]),
      new Colour(Colour.RGBA, [65, 65, 65, 255]),
      new Colour(Colour.RGBA, [76, 76, 76, 255]),
      new Colour(Colour.RGBA, [40, 40, 40, 255]),
      new Colour(Colour.RGBA, [108, 108, 108, 255]),
      new Colour(Colour.RGBA, [132, 132, 132, 255]),
      new Colour(Colour.RGBA, [153, 153, 153, 255]),
      new Colour(Colour.RGBA, [81, 81, 81, 255]),
      new Colour(Colour.RGBA, [53, 89, 108, 255]),
      new Colour(Colour.RGBA, [65, 109, 132, 255]),
      new Colour(Colour.RGBA, [76, 127, 153, 255]),
      new Colour(Colour.RGBA, [40, 67, 81, 255]),
      new Colour(Colour.RGBA, [89, 44, 125, 255]),
      new Colour(Colour.RGBA, [109, 54, 153, 255]),
      new Colour(Colour.RGBA, [127, 63, 178, 255]),
      new Colour(Colour.RGBA, [67, 33, 94, 255]),
      new Colour(Colour.RGBA, [36, 53, 125, 255]),
      new Colour(Colour.RGBA, [44, 65, 153, 255]),
      new Colour(Colour.RGBA, [51, 76, 178, 255]),
      new Colour(Colour.RGBA, [27, 40, 94, 255]),
      new Colour(Colour.RGBA, [72, 53, 36, 255]),
      new Colour(Colour.RGBA, [88, 65, 44, 255]),
      new Colour(Colour.RGBA, [102, 76, 51, 255]),
      new Colour(Colour.RGBA, [54, 40, 27, 255]),
      new Colour(Colour.RGBA, [72, 89, 36, 255]),
      new Colour(Colour.RGBA, [88, 109, 44, 255]),
      new Colour(Colour.RGBA, [102, 127, 51, 255]),
      new Colour(Colour.RGBA, [54, 67, 27, 255]),
      new Colour(Colour.RGBA, [108, 36, 36, 255]),
      new Colour(Colour.RGBA, [132, 44, 44, 255]),
      new Colour(Colour.RGBA, [153, 51, 51, 255]),
      new Colour(Colour.RGBA, [81, 27, 27, 255]),
      new Colour(Colour.RGBA, [17, 17, 17, 255]),
      new Colour(Colour.RGBA, [21, 21, 21, 255]),
      new Colour(Colour.RGBA, [25, 25, 25, 255]),
      new Colour(Colour.RGBA, [13, 13, 13, 255]),
      new Colour(Colour.RGBA, [176, 168, 54, 255]),
      new Colour(Colour.RGBA, [215, 205, 66, 255]),
      new Colour(Colour.RGBA, [250, 238, 77, 255]),
      new Colour(Colour.RGBA, [132, 126, 40, 255]),
      new Colour(Colour.RGBA, [64, 154, 150, 255]),
      new Colour(Colour.RGBA, [79, 188, 183, 255]),
      new Colour(Colour.RGBA, [92, 219, 213, 255]),
      new Colour(Colour.RGBA, [48, 115, 112, 255]),
      new Colour(Colour.RGBA, [52, 90, 180, 255]),
      new Colour(Colour.RGBA, [63, 110, 220, 255]),
      new Colour(Colour.RGBA, [74, 128, 255, 255]),
      new Colour(Colour.RGBA, [39, 67, 135, 255]),
      new Colour(Colour.RGBA, [0, 153, 40, 255]),
      new Colour(Colour.RGBA, [0, 187, 50, 255]),
      new Colour(Colour.RGBA, [0, 217, 58, 255]),
      new Colour(Colour.RGBA, [0, 114, 30, 255]),
      new Colour(Colour.RGBA, [91, 60, 34, 255]),
      new Colour(Colour.RGBA, [111, 74, 42, 255]),
      new Colour(Colour.RGBA, [129, 86, 49, 255]),
      new Colour(Colour.RGBA, [68, 45, 25, 255]),
      new Colour(Colour.RGBA, [79, 1, 0, 255]),
      new Colour(Colour.RGBA, [96, 1, 0, 255]),
      new Colour(Colour.RGBA, [112, 2, 0, 255]),
      new Colour(Colour.RGBA, [59, 1, 0, 255])
    ];
  } else if (new_colors == '112') {
    minecraftcolors = [
      new Colour(Colour.RGBA, [0, 0, 0, 255]),
      new Colour(Colour.RGBA, [89, 125, 39, 255]),
      new Colour(Colour.RGBA, [109, 153, 48, 255]),
      new Colour(Colour.RGBA, [127, 178, 56, 255]),
      new Colour(Colour.RGBA, [67, 94, 29, 255]),
      new Colour(Colour.RGBA, [174, 164, 115, 255]),
      new Colour(Colour.RGBA, [213, 201, 140, 255]),
      new Colour(Colour.RGBA, [247, 233, 163, 255]),
      new Colour(Colour.RGBA, [130, 123, 86, 255]),
      new Colour(Colour.RGBA, [140, 140, 140, 255]),
      new Colour(Colour.RGBA, [171, 171, 171, 255]),
      new Colour(Colour.RGBA, [199, 199, 199, 255]),
      new Colour(Colour.RGBA, [105, 105, 105, 255]),
      new Colour(Colour.RGBA, [180, 0, 0, 255]),
      new Colour(Colour.RGBA, [220, 0, 0, 255]),
      new Colour(Colour.RGBA, [255, 0, 0, 255]),
      new Colour(Colour.RGBA, [135, 0, 0, 255]),
      new Colour(Colour.RGBA, [112, 112, 180, 255]),
      new Colour(Colour.RGBA, [138, 138, 220, 255]),
      new Colour(Colour.RGBA, [160, 160, 255, 255]),
      new Colour(Colour.RGBA, [84, 84, 135, 255]),
      new Colour(Colour.RGBA, [117, 117, 117, 255]),
      new Colour(Colour.RGBA, [144, 144, 144, 255]),
      new Colour(Colour.RGBA, [167, 167, 167, 255]),
      new Colour(Colour.RGBA, [88, 88, 88, 255]),
      new Colour(Colour.RGBA, [0, 87, 0, 255]),
      new Colour(Colour.RGBA, [0, 106, 0, 255]),
      new Colour(Colour.RGBA, [0, 124, 0, 255]),
      new Colour(Colour.RGBA, [0, 65, 0, 255]),
      new Colour(Colour.RGBA, [180, 180, 180, 255]),
      new Colour(Colour.RGBA, [220, 220, 220, 255]),
      new Colour(Colour.RGBA, [255, 255, 255, 255]),
      new Colour(Colour.RGBA, [135, 135, 135, 255]),
      new Colour(Colour.RGBA, [115, 118, 129, 255]),
      new Colour(Colour.RGBA, [141, 144, 158, 255]),
      new Colour(Colour.RGBA, [164, 168, 184, 255]),
      new Colour(Colour.RGBA, [86, 88, 97, 255]),
      new Colour(Colour.RGBA, [106, 76, 54, 255]),
      new Colour(Colour.RGBA, [130, 94, 66, 255]),
      new Colour(Colour.RGBA, [151, 109, 77, 255]),
      new Colour(Colour.RGBA, [79, 57, 40, 255]),
      new Colour(Colour.RGBA, [79, 79, 79, 255]),
      new Colour(Colour.RGBA, [96, 96, 96, 255]),
      new Colour(Colour.RGBA, [112, 112, 112, 255]),
      new Colour(Colour.RGBA, [59, 59, 59, 255]),
      new Colour(Colour.RGBA, [45, 45, 180, 255]),
      new Colour(Colour.RGBA, [55, 55, 220, 255]),
      new Colour(Colour.RGBA, [64, 64, 255, 255]),
      new Colour(Colour.RGBA, [33, 33, 135, 255]),
      new Colour(Colour.RGBA, [100, 84, 50, 255]),
      new Colour(Colour.RGBA, [123, 102, 62, 255]),
      new Colour(Colour.RGBA, [143, 119, 72, 255]),
      new Colour(Colour.RGBA, [75, 63, 38, 255]),
      new Colour(Colour.RGBA, [180, 177, 172, 255]),
      new Colour(Colour.RGBA, [220, 217, 211, 255]),
      new Colour(Colour.RGBA, [255, 252, 245, 255]),
      new Colour(Colour.RGBA, [135, 133, 129, 255]),
      new Colour(Colour.RGBA, [152, 89, 36, 255]),
      new Colour(Colour.RGBA, [186, 109, 44, 255]),
      new Colour(Colour.RGBA, [216, 127, 51, 255]),
      new Colour(Colour.RGBA, [114, 67, 27, 255]),
      new Colour(Colour.RGBA, [125, 53, 152, 255]),
      new Colour(Colour.RGBA, [153, 65, 186, 255]),
      new Colour(Colour.RGBA, [178, 76, 216, 255]),
      new Colour(Colour.RGBA, [94, 40, 114, 255]),
      new Colour(Colour.RGBA, [72, 108, 152, 255]),
      new Colour(Colour.RGBA, [88, 132, 186, 255]),
      new Colour(Colour.RGBA, [102, 153, 216, 255]),
      new Colour(Colour.RGBA, [54, 81, 114, 255]),
      new Colour(Colour.RGBA, [161, 161, 36, 255]),
      new Colour(Colour.RGBA, [197, 197, 44, 255]),
      new Colour(Colour.RGBA, [229, 229, 51, 255]),
      new Colour(Colour.RGBA, [121, 121, 27, 255]),
      new Colour(Colour.RGBA, [89, 144, 17, 255]),
      new Colour(Colour.RGBA, [109, 176, 21, 255]),
      new Colour(Colour.RGBA, [127, 204, 25, 255]),
      new Colour(Colour.RGBA, [67, 108, 13, 255]),
      new Colour(Colour.RGBA, [170, 89, 116, 255]),
      new Colour(Colour.RGBA, [208, 109, 142, 255]),
      new Colour(Colour.RGBA, [242, 127, 165, 255]),
      new Colour(Colour.RGBA, [128, 67, 87, 255]),
      new Colour(Colour.RGBA, [53, 53, 53, 255]),
      new Colour(Colour.RGBA, [65, 65, 65, 255]),
      new Colour(Colour.RGBA, [76, 76, 76, 255]),
      new Colour(Colour.RGBA, [40, 40, 40, 255]),
      new Colour(Colour.RGBA, [108, 108, 108, 255]),
      new Colour(Colour.RGBA, [132, 132, 132, 255]),
      new Colour(Colour.RGBA, [153, 153, 153, 255]),
      new Colour(Colour.RGBA, [81, 81, 81, 255]),
      new Colour(Colour.RGBA, [53, 89, 108, 255]),
      new Colour(Colour.RGBA, [65, 109, 132, 255]),
      new Colour(Colour.RGBA, [76, 127, 153, 255]),
      new Colour(Colour.RGBA, [40, 67, 81, 255]),
      new Colour(Colour.RGBA, [89, 44, 125, 255]),
      new Colour(Colour.RGBA, [109, 54, 153, 255]),
      new Colour(Colour.RGBA, [127, 63, 178, 255]),
      new Colour(Colour.RGBA, [67, 33, 94, 255]),
      new Colour(Colour.RGBA, [36, 53, 125, 255]),
      new Colour(Colour.RGBA, [44, 65, 153, 255]),
      new Colour(Colour.RGBA, [51, 76, 178, 255]),
      new Colour(Colour.RGBA, [27, 40, 94, 255]),
      new Colour(Colour.RGBA, [72, 53, 36, 255]),
      new Colour(Colour.RGBA, [88, 65, 44, 255]),
      new Colour(Colour.RGBA, [102, 76, 51, 255]),
      new Colour(Colour.RGBA, [54, 40, 27, 255]),
      new Colour(Colour.RGBA, [72, 89, 36, 255]),
      new Colour(Colour.RGBA, [88, 109, 44, 255]),
      new Colour(Colour.RGBA, [102, 127, 51, 255]),
      new Colour(Colour.RGBA, [54, 67, 27, 255]),
      new Colour(Colour.RGBA, [108, 36, 36, 255]),
      new Colour(Colour.RGBA, [132, 44, 44, 255]),
      new Colour(Colour.RGBA, [153, 51, 51, 255]),
      new Colour(Colour.RGBA, [81, 27, 27, 255]),
      new Colour(Colour.RGBA, [17, 17, 17, 255]),
      new Colour(Colour.RGBA, [21, 21, 21, 255]),
      new Colour(Colour.RGBA, [25, 25, 25, 255]),
      new Colour(Colour.RGBA, [13, 13, 13, 255]),
      new Colour(Colour.RGBA, [176, 168, 54, 255]),
      new Colour(Colour.RGBA, [215, 205, 66, 255]),
      new Colour(Colour.RGBA, [250, 238, 77, 255]),
      new Colour(Colour.RGBA, [132, 126, 40, 255]),
      new Colour(Colour.RGBA, [64, 154, 150, 255]),
      new Colour(Colour.RGBA, [79, 188, 183, 255]),
      new Colour(Colour.RGBA, [92, 219, 213, 255]),
      new Colour(Colour.RGBA, [48, 115, 112, 255]),
      new Colour(Colour.RGBA, [52, 90, 180, 255]),
      new Colour(Colour.RGBA, [63, 110, 220, 255]),
      new Colour(Colour.RGBA, [74, 128, 255, 255]),
      new Colour(Colour.RGBA, [39, 67, 135, 255]),
      new Colour(Colour.RGBA, [0, 153, 40, 255]),
      new Colour(Colour.RGBA, [0, 187, 50, 255]),
      new Colour(Colour.RGBA, [0, 217, 58, 255]),
      new Colour(Colour.RGBA, [0, 114, 30, 255]),
      new Colour(Colour.RGBA, [91, 60, 34, 255]),
      new Colour(Colour.RGBA, [111, 74, 42, 255]),
      new Colour(Colour.RGBA, [129, 86, 49, 255]),
      new Colour(Colour.RGBA, [68, 45, 25, 255]),
      new Colour(Colour.RGBA, [79, 1, 0, 255]),
      new Colour(Colour.RGBA, [96, 1, 0, 255]),
      new Colour(Colour.RGBA, [112, 2, 0, 255]),
      new Colour(Colour.RGBA, [59, 1, 0, 255]),
      new Colour(Colour.RGBA, [147, 124, 113, 255]),
      new Colour(Colour.RGBA, [180, 152, 138, 255]),
      new Colour(Colour.RGBA, [209, 177, 161, 255]),
      new Colour(Colour.RGBA, [110, 93, 85, 255]),
      new Colour(Colour.RGBA, [112, 57, 25, 255]),
      new Colour(Colour.RGBA, [137, 70, 31, 255]),
      new Colour(Colour.RGBA, [159, 82, 36, 255]),
      new Colour(Colour.RGBA, [84, 43, 19, 255]),
      new Colour(Colour.RGBA, [105, 61, 76, 255]),
      new Colour(Colour.RGBA, [128, 75, 93, 255]),
      new Colour(Colour.RGBA, [149, 87, 108, 255]),
      new Colour(Colour.RGBA, [78, 46, 57, 255]),
      new Colour(Colour.RGBA, [79, 76, 97, 255]),
      new Colour(Colour.RGBA, [96, 93, 119, 255]),
      new Colour(Colour.RGBA, [112, 108, 138, 255]),
      new Colour(Colour.RGBA, [59, 57, 73, 255]),
      new Colour(Colour.RGBA, [131, 93, 25, 255]),
      new Colour(Colour.RGBA, [160, 114, 31, 255]),
      new Colour(Colour.RGBA, [186, 133, 36, 255]),
      new Colour(Colour.RGBA, [98, 70, 19, 255]),
      new Colour(Colour.RGBA, [72, 82, 37, 255]),
      new Colour(Colour.RGBA, [88, 100, 45, 255]),
      new Colour(Colour.RGBA, [103, 117, 53, 255]),
      new Colour(Colour.RGBA, [54, 61, 28, 255]),
      new Colour(Colour.RGBA, [112, 54, 55, 255]),
      new Colour(Colour.RGBA, [138, 66, 67, 255]),
      new Colour(Colour.RGBA, [160, 77, 78, 255]),
      new Colour(Colour.RGBA, [84, 40, 41, 255]),
      new Colour(Colour.RGBA, [40, 28, 24, 255]),
      new Colour(Colour.RGBA, [49, 35, 30, 255]),
      new Colour(Colour.RGBA, [57, 41, 35, 255]),
      new Colour(Colour.RGBA, [30, 21, 18, 255]),
      new Colour(Colour.RGBA, [95, 75, 69, 255]),
      new Colour(Colour.RGBA, [116, 92, 84, 255]),
      new Colour(Colour.RGBA, [135, 107, 98, 255]),
      new Colour(Colour.RGBA, [71, 56, 51, 255]),
      new Colour(Colour.RGBA, [61, 64, 64, 255]),
      new Colour(Colour.RGBA, [75, 79, 79, 255]),
      new Colour(Colour.RGBA, [87, 92, 92, 255]),
      new Colour(Colour.RGBA, [46, 48, 48, 255]),
      new Colour(Colour.RGBA, [86, 51, 62, 255]),
      new Colour(Colour.RGBA, [105, 62, 75, 255]),
      new Colour(Colour.RGBA, [122, 73, 88, 255]),
      new Colour(Colour.RGBA, [64, 38, 46, 255]),
      new Colour(Colour.RGBA, [53, 43, 64, 255]),
      new Colour(Colour.RGBA, [65, 53, 79, 255]),
      new Colour(Colour.RGBA, [76, 62, 92, 255]),
      new Colour(Colour.RGBA, [40, 32, 48, 255]),
      new Colour(Colour.RGBA, [53, 35, 24, 255]),
      new Colour(Colour.RGBA, [65, 43, 30, 255]),
      new Colour(Colour.RGBA, [76, 50, 35, 255]),
      new Colour(Colour.RGBA, [40, 26, 18, 255]),
      new Colour(Colour.RGBA, [53, 57, 29, 255]),
      new Colour(Colour.RGBA, [65, 70, 36, 255]),
      new Colour(Colour.RGBA, [76, 82, 42, 255]),
      new Colour(Colour.RGBA, [40, 43, 22, 255])
    ];
  } else {
    minecraftcolors = [
      new Colour(Colour.RGBA, [255, 255, 255, 0]),
      new Colour(Colour.RGBA, [89, 125, 39, 255]),
      new Colour(Colour.RGBA, [109, 153, 48, 255]),
      new Colour(Colour.RGBA, [127, 178, 56, 255]),
      new Colour(Colour.RGBA, [67, 94, 29, 255]),
      new Colour(Colour.RGBA, [174, 164, 115, 255]),
      new Colour(Colour.RGBA, [213, 201, 140, 255]),
      new Colour(Colour.RGBA, [247, 233, 163, 255]),
      new Colour(Colour.RGBA, [130, 123, 86, 255]),
      new Colour(Colour.RGBA, [140, 140, 140, 255]),
      new Colour(Colour.RGBA, [171, 171, 171, 255]),
      new Colour(Colour.RGBA, [199, 199, 199, 255]),
      new Colour(Colour.RGBA, [105, 105, 105, 255]),
      new Colour(Colour.RGBA, [180, 0, 0, 255]),
      new Colour(Colour.RGBA, [220, 0, 0, 255]),
      new Colour(Colour.RGBA, [255, 0, 0, 255]),
      new Colour(Colour.RGBA, [135, 0, 0, 255]),
      new Colour(Colour.RGBA, [112, 112, 180, 255]),
      new Colour(Colour.RGBA, [138, 138, 220, 255]),
      new Colour(Colour.RGBA, [160, 160, 255, 255]),
      new Colour(Colour.RGBA, [84, 84, 135, 255]),
      new Colour(Colour.RGBA, [117, 117, 117, 255]),
      new Colour(Colour.RGBA, [144, 144, 144, 255]),
      new Colour(Colour.RGBA, [167, 167, 167, 255]),
      new Colour(Colour.RGBA, [88, 88, 88, 255]),
      new Colour(Colour.RGBA, [0, 87, 0, 255]),
      new Colour(Colour.RGBA, [0, 106, 0, 255]),
      new Colour(Colour.RGBA, [0, 124, 0, 255]),
      new Colour(Colour.RGBA, [0, 65, 0, 255]),
      new Colour(Colour.RGBA, [175, 180, 179, 255]),
      new Colour(Colour.RGBA, [214, 220, 219, 255]),
      new Colour(Colour.RGBA, [249, 255, 254, 255]),
      new Colour(Colour.RGBA, [131, 135, 134, 255]),
      new Colour(Colour.RGBA, [115, 118, 129, 255]),
      new Colour(Colour.RGBA, [141, 144, 158, 255]),
      new Colour(Colour.RGBA, [164, 168, 184, 255]),
      new Colour(Colour.RGBA, [86, 88, 97, 255]),
      new Colour(Colour.RGBA, [106, 76, 54, 255]),
      new Colour(Colour.RGBA, [130, 94, 66, 255]),
      new Colour(Colour.RGBA, [151, 109, 77, 255]),
      new Colour(Colour.RGBA, [79, 57, 40, 255]),
      new Colour(Colour.RGBA, [79, 79, 79, 255]),
      new Colour(Colour.RGBA, [96, 96, 96, 255]),
      new Colour(Colour.RGBA, [112, 112, 112, 255]),
      new Colour(Colour.RGBA, [59, 59, 59, 255]),
      new Colour(Colour.RGBA, [45, 45, 180, 255]),
      new Colour(Colour.RGBA, [55, 55, 220, 255]),
      new Colour(Colour.RGBA, [64, 64, 255, 255]),
      new Colour(Colour.RGBA, [33, 33, 135, 255]),
      new Colour(Colour.RGBA, [100, 84, 50, 255]),
      new Colour(Colour.RGBA, [123, 102, 62, 255]),
      new Colour(Colour.RGBA, [143, 119, 72, 255]),
      new Colour(Colour.RGBA, [75, 63, 38, 255]),
      new Colour(Colour.RGBA, [180, 177, 172, 255]),
      new Colour(Colour.RGBA, [220, 217, 211, 255]),
      new Colour(Colour.RGBA, [255, 252, 245, 255]),
      new Colour(Colour.RGBA, [135, 133, 129, 255]),
      new Colour(Colour.RGBA, [175, 90, 20, 255]),
      new Colour(Colour.RGBA, [214, 110, 25, 255]),
      new Colour(Colour.RGBA, [249, 128, 29, 255]),
      new Colour(Colour.RGBA, [131, 67, 15, 255]),
      new Colour(Colour.RGBA, [140, 55, 133, 255]),
      new Colour(Colour.RGBA, [171, 67, 163, 255]),
      new Colour(Colour.RGBA, [199, 78, 189, 255]),
      new Colour(Colour.RGBA, [105, 41, 100, 255]),
      new Colour(Colour.RGBA, [40, 126, 153, 255]),
      new Colour(Colour.RGBA, [50, 154, 188, 255]),
      new Colour(Colour.RGBA, [58, 179, 218, 255]),
      new Colour(Colour.RGBA, [30, 94, 115, 255]),
      new Colour(Colour.RGBA, [179, 152, 43, 255]),
      new Colour(Colour.RGBA, [219, 186, 52, 255]),
      new Colour(Colour.RGBA, [254, 216, 61, 255]),
      new Colour(Colour.RGBA, [134, 114, 32, 255]),
      new Colour(Colour.RGBA, [90, 140, 21, 255]),
      new Colour(Colour.RGBA, [110, 171, 26, 255]),
      new Colour(Colour.RGBA, [128, 199, 31, 255]),
      new Colour(Colour.RGBA, [67, 105, 16, 255]),
      new Colour(Colour.RGBA, [171, 98, 120, 255]),
      new Colour(Colour.RGBA, [209, 119, 146, 255]),
      new Colour(Colour.RGBA, [243, 139, 170, 255]),
      new Colour(Colour.RGBA, [128, 73, 90, 255]),
      new Colour(Colour.RGBA, [50, 55, 57, 255]),
      new Colour(Colour.RGBA, [61, 68, 70, 255]),
      new Colour(Colour.RGBA, [71, 79, 82, 255]),
      new Colour(Colour.RGBA, [37, 41, 43, 255]),
      new Colour(Colour.RGBA, [110, 110, 106, 255]),
      new Colour(Colour.RGBA, [135, 135, 130, 255]),
      new Colour(Colour.RGBA, [157, 157, 151, 255]),
      new Colour(Colour.RGBA, [83, 83, 79, 255]),
      new Colour(Colour.RGBA, [15, 110, 110, 255]),
      new Colour(Colour.RGBA, [18, 134, 134, 255]),
      new Colour(Colour.RGBA, [22, 156, 156, 255]),
      new Colour(Colour.RGBA, [11, 82, 82, 255]),
      new Colour(Colour.RGBA, [96, 35, 129, 255]),
      new Colour(Colour.RGBA, [118, 43, 158, 255]),
      new Colour(Colour.RGBA, [137, 50, 184, 255]),
      new Colour(Colour.RGBA, [72, 26, 97, 255]),
      new Colour(Colour.RGBA, [42, 48, 120, 255]),
      new Colour(Colour.RGBA, [51, 58, 146, 255]),
      new Colour(Colour.RGBA, [60, 68, 170, 255]),
      new Colour(Colour.RGBA, [31, 36, 90, 255]),
      new Colour(Colour.RGBA, [92, 59, 35, 255]),
      new Colour(Colour.RGBA, [113, 72, 43, 255]),
      new Colour(Colour.RGBA, [131, 84, 50, 255]),
      new Colour(Colour.RGBA, [69, 44, 26, 255]),
      new Colour(Colour.RGBA, [66, 87, 15, 255]),
      new Colour(Colour.RGBA, [81, 106, 18, 255]),
      new Colour(Colour.RGBA, [94, 124, 22, 255]),
      new Colour(Colour.RGBA, [49, 65, 11, 255]),
      new Colour(Colour.RGBA, [124, 32, 26, 255]),
      new Colour(Colour.RGBA, [151, 39, 32, 255]),
      new Colour(Colour.RGBA, [176, 46, 38, 255]),
      new Colour(Colour.RGBA, [93, 24, 20, 255]),
      new Colour(Colour.RGBA, [20, 20, 23, 255]),
      new Colour(Colour.RGBA, [25, 25, 28, 255]),
      new Colour(Colour.RGBA, [29, 29, 33, 255]),
      new Colour(Colour.RGBA, [15, 15, 17, 255]),
      new Colour(Colour.RGBA, [176, 168, 54, 255]),
      new Colour(Colour.RGBA, [215, 205, 66, 255]),
      new Colour(Colour.RGBA, [250, 238, 77, 255]),
      new Colour(Colour.RGBA, [132, 126, 40, 255]),
      new Colour(Colour.RGBA, [64, 154, 150, 255]),
      new Colour(Colour.RGBA, [79, 188, 183, 255]),
      new Colour(Colour.RGBA, [92, 219, 213, 255]),
      new Colour(Colour.RGBA, [48, 115, 112, 255]),
      new Colour(Colour.RGBA, [52, 90, 180, 255]),
      new Colour(Colour.RGBA, [63, 110, 220, 255]),
      new Colour(Colour.RGBA, [74, 128, 255, 255]),
      new Colour(Colour.RGBA, [39, 67, 135, 255]),
      new Colour(Colour.RGBA, [0, 153, 40, 255]),
      new Colour(Colour.RGBA, [0, 187, 50, 255]),
      new Colour(Colour.RGBA, [0, 217, 58, 255]),
      new Colour(Colour.RGBA, [0, 114, 30, 255]),
      new Colour(Colour.RGBA, [91, 60, 34, 255]),
      new Colour(Colour.RGBA, [111, 74, 42, 255]),
      new Colour(Colour.RGBA, [129, 86, 49, 255]),
      new Colour(Colour.RGBA, [68, 45, 25, 255]),
      new Colour(Colour.RGBA, [79, 1, 0, 255]),
      new Colour(Colour.RGBA, [96, 1, 0, 255]),
      new Colour(Colour.RGBA, [112, 2, 0, 255]),
      new Colour(Colour.RGBA, [59, 1, 0, 255])
    ];
  }

  minecraftcolors_laba = [];
  for (var i = 0; i < minecraftcolors.length; i++) {
    minecraftcolors_laba.push(minecraftcolors[i].convertTo(Colour.LABA));
  }
  minecraftcolors_hsva = [];
  for (var i = 0; i < minecraftcolors.length; i++) {
    minecraftcolors_hsva.push(minecraftcolors[i].convertTo(Colour.HSVA));
  }
  minecraftcolors_xyza = [];
  for (var i = 0; i < minecraftcolors.length; i++) {
    minecraftcolors_xyza.push(minecraftcolors[i].convertTo(Colour.XYZA));
  }
}