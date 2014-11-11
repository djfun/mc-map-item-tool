document.getElementById("submit").addEventListener("click", create_command, false);

function create_command(event) {
  var mapnumber = $('#mapnumber').val();
  var map_parts_horizontal = $('#map_parts_horizontal').val();
  var map_parts_vertical = $('#map_parts_vertical').val();
  var direction = $('#direction').val();
  
  var worker = new Worker("commandblock_worker.js");

  worker.postMessage({mapnumber: mapnumber,
    count: map_parts_horizontal * map_parts_vertical,
    dim_vertical: map_parts_vertical,
    direction: direction});

  worker.onmessage = function(oEvent) {
    $('#output').val(oEvent.data);
  };


}