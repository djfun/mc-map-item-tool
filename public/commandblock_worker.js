onmessage = function (oEvent) {
  var direction = parseInt(oEvent.data.direction, 10);
  var mapnumber = parseInt(oEvent.data.mapnumber, 10);
  var dim_vertical = oEvent.data.dim_vertical;
  var count = oEvent.data.count;

  var command = create_commandblock_string(direction, mapnumber, dim_vertical, count);

  postMessage(command);
};

function create_commandblock_string(direction, map_index, dim_vertical, count) {
  var text = 'summon MinecartCommandBlock ~ ~1 ~ ';
  var x, y, z;
  text+= '{Riding: {id: FallingSand, Riding:{id:MinecartCommandBlock,' +
    'Riding: {id: FallingSand, Riding:{id:MinecartCommandBlock,';
  var i, index;
  for (i = 0; i < count; i++) {
    text+= 'Riding: {id: FallingSand, Riding:{id:MinecartCommandBlock,';
  }
  text+= 'Riding:{id:FallingSand,Block:minecraft:activator_rail,Time:1}';

  text+= ',Command:kill @e[type=MinecartCommandBlock,r=1]}}';

  for (i = 0; i < count; i++) {
    index = i + map_index;
    if (direction === 0) {
      // Towards negative z
      x = Math.floor(i / dim_vertical);
      y = dim_vertical - (i % dim_vertical) - 2;
      z = -2;
    } else if (direction == 1) {
      // Towards positive x
      x = 2;
      y = dim_vertical - (i % dim_vertical) - 2;
      z = Math.floor(i / dim_vertical);
    } else if (direction == 2) {
      // Towards positive z
      x = -Math.floor(i / dim_vertical);
      y = dim_vertical - (i % dim_vertical) - 2;
      z = 2;
    } else if (direction == 3) {
      // Towards negative x
      x = -2;
      y = dim_vertical - (i % dim_vertical) - 2;
      z = -Math.floor(i / dim_vertical);
    }


    text+= ',Command:"summon ItemFrame ~' + x + ' ~' + y + ' ~' + z + ' {Direction:' +
      direction + ',Item:{id:minecraft:filled_map, Damage:' + index + '}}"}}';
  }

  if (direction === 0) {
    x1 = 0;
    y1 = dim_vertical - 2;
    z1 = -3;

    x2 = count / dim_vertical - 1;
    y2 = -1;
    z2 = -3;
  } else if (direction == 1) {
    x1 = 3;
    y1 = dim_vertical - 2;
    z1 = 0;

    x2 = 3;
    y2 = -1;
    z2 = count / dim_vertical - 1;
  } else if (direction == 2) {
    x1 = 0;
    y1 = dim_vertical - 2;
    z1 = 3;

    x2 = (count / dim_vertical - 1) * -1;
    y2 = -1;
    z2 = 3;
  } else if (direction == 3) {
    x1 = -3;
    y1 = dim_vertical - 2;
    z1 = 0;

    x2 = -3;
    y2 = -1;
    z2 = (count / dim_vertical - 1) * -1;
  }

  text+= ',Command:fill ~' + x1 + ' ~' + y1 + ' ~' + z1 +
    ' ~' + x2 + ' ~' + y2 + ' ~' + z2 + ' minecraft:sandstone}},}';

  return text;
}