/**
  The Colour object allows conversion of colours between strings and several
  other colour spaces.

  The colour has two public members. It's type is the type of colour space. Its
  values are an array of numbers specifying the colour coordinates. These
  coordinates depend on the type of colour space used.

  @constructor
  @param {number} type
  @param {Array.<number>} values
 */ 
function Colour(type, values)
{
    this.type = type;
    this.values = values;

    if ( this.values.length < 4 ) {
        throw "Bad value";
    }
}

// Here is an enumeration of colour spaces.

// RGBA. All components are in the range 0..1
Colour.RGBA = 0;

// CIE XYZ, with added alpha value.
Colour.XYZA = 1;

// Hue/Saturation/Value. Hue is in the range 0...360 and the others are 0...1
Colour.HSVA = 2;

// CIE LAB 1976 colour space, with added alpha component.
Colour.LABA = 3;

Colour.LAST_COLOURSPACE = 3;

/**
  Creates an RGBA colour object from the given string. If the string is not
  valid, a default colour of magenta is used. Valid strings are one of the
  following:

  1. A standard CSS colour name (eg. "Blue"). The case does not matter.

  2. A CSS hex string with 6 digits. Eg. #80ff00

  3. An rgba value. Eg. rgba( 128, 255, 0, 1.0 ). Note the last component must
     be in the range 0..1 and the others are in the range 0..255.

  @param {string} colourString
  @return {Colour}
 */ 
Colour.fromString = function( colourString )
{
    if ( colourString.toLowerCase() in Colour.CssColours ) {
        colourString = Colour.CssColours[colourString.toLowerCase()];
    }

    var hex6 = /\#([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])/i;
    var rgbStr = /rgba\( *([0-9]+) *, *([0-9]+) *, *([0-9]+) *, *([0-9\.]+) *\)/;
    var r, g, b,a;

    var m = hex6.exec( colourString );
    if ( m !== null ) {
        r = parseInt( m[1], 16 ) / 255;
        g = parseInt( m[2], 16 ) / 255;
        b = parseInt( m[3], 16 ) / 255;
        a = 1.0;
    } else {
        m = rgbStr.exec( colourString );
        if ( m !== null ) {
            r = parseFloat(m[1])/255;
            g = parseFloat(m[2])/255;
            b = parseFloat(m[3])/255;
            a = parseFloat(m[4]);
        } else {
            // default colour
            r = 1.0;
            g = 0.0;
            b = 1.0;
            a = 1.0;
        }
    }

    return new Colour( Colour.RGBA, [r, g, b, a] );
};

Colour.prototype = {

    /**
      Converts the colour to a string. The string is formatted such that it can
      be used to set the fillStyle or strokeStyle of an HTML5 Canvas 2d context.

      @return {string}
     */ 
    toString: function()
    {
        function toHex(val)
        {
            val = Math.round( val * 255 );
            if ( val < 16 ) {
                return "0" + val.toString(16);
            } else {
                return val.toString(16);
            }
        }

        var clr = this.convertTo( Colour.RGBA );

        if ( clr.values[3] === 1.0 ) {
            return "#" + 
                toHex( clr.values[0] ) +
                toHex( clr.values[1] ) +
                toHex( clr.values[2] );
        } else {
            return "rgba(" + 
                Math.round(clr.values[0]*255) + "," +
                Math.round(clr.values[1]*255) + "," +
                Math.round(clr.values[2]*255) + "," +
                clr.values[3] + ")";
        }
    },

    /**
      Returns a new colour object, converting to the given colour space.

      @param {number} type
      @return {Colour}
     */ 
    convertTo: function( type )
    {
        return Colour.converters[this.type][type](this);
    },

    /**
      Returns the distance between this colour and another, using the colour
      space of this colour. If the other colour is another colour space, it is
      converted before the calculation is done.
     */
    distanceTo: function( colour )
    {
        if ( colour.type !== this.type ) {
            colour = colour.convertTo( this.type );
        }

        if ( this.type === Colour.HSVA ) {
            // Hue goes from 0 to 360, unlike other colour schemes, so it needs
            // to be scaled relative to the other values. It must also wrap
            // around.

            var a = this.values[0], b = colour.values[0];
            var hueDiff;
            if ( a > b ) {
                hueDiff = Math.min( a - b, b - a + 360 );
            } else {
                hueDiff = Math.min( b - a, a - b + 360 );
            }

            hueDiff /= 360;

            return Math.pow( 
                   hueDiff * hueDiff + 
                   ( this.values[1] - colour.values[1] ) *
                   ( this.values[1] - colour.values[1] ) +
                   ( this.values[2] - colour.values[2] ) *
                   ( this.values[2] - colour.values[2] ), 0.5 );

        } else {
            return Math.pow( 
                   ( this.values[0] - colour.values[0] ) *
                   ( this.values[0] - colour.values[0] ) +
                   ( this.values[1] - colour.values[1] ) *
                   ( this.values[1] - colour.values[1] ) +
                   ( this.values[2] - colour.values[2] ) *
                   ( this.values[2] - colour.values[2] ), 0.5 );
        }
    }

};

(function(){

    var WHITE = {X: 0.9505, Y: 1.0000, Z: 1.0890}; // D65

    /**
      @param {Colour} clr
      @return {Colour}
     */ 
    function convert_HSVA_RGBA( clr )
    {
        var h = clr.values[0];
        var s = clr.values[1];
        var v = clr.values[2];
        if ( h < 0 ) { h += 360; }
        var hi = Math.floor( h / 60 ) % 6;
        var f = h / 60 - Math.floor( h / 60 );
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - ( 1 - f ) * s );
        var r, g, b;
        switch( hi ) {
        case 0: 
            r = v;
            g = t;
            b = p;
            break;
        case 1: 
            r = q;
            g = v;
            b = p;
            break;
        case 2: 
            r = p;
            g = v;
            b = t;
            break;
        case 3: 
            r = p;
            g = q;
            b = v;
            break;
        case 4: 
            r = t;
            g = p;
            b = v;
            break;
        case 5: 
            r = v;
            g = p;
            b = q;
            break;
        }

        return new Colour( Colour.RGBA, [ r, g, b, clr.values[3] ] );
    }

    /**
      @param {Colour} clr
      @return {Colour}
     */ 
    function convert_RGBA_HSVA( clr )
    {
        var h, s, v;
        var r = clr.values[0];
        var g = clr.values[1];
        var b = clr.values[2];
        var max = Math.max( r, g, b );
        var min = Math.min( r, g, b );
        if ( max === min ) {
            h = 0;
        } else if ( max === r ) {
            h = ( 60 * (g - b) / ( max - min ) + 360 ) % 360;
        } else if ( max === g ) {
            h = 60 * ( b - r ) / ( max - min ) + 120;
        } else if ( max === b ) {
            h = 60 * ( r - g ) / ( max - min ) + 240;
        }

        if ( max === 0 ) {
            s = 0;
        } else {
            s = 1 - min / max;
        }

        v = max;

        return new Colour( Colour.HSVA, [ h, s, v, clr.values[3] ] );
    }

    /**
      @param {Colour} clr
      @return {Colour}
     */ 
    function convert_XYZA_LABA( clr ) 
    {
        function f(t) 
        {
            if ( t > ( 6.0 / 29.0 ) * ( 6.0 / 29.0 ) * (6.0 / 29.0 ) ) {
                return Math.pow( t, 1.0 / 3.0 );
            } else {
                return ( 1.0 / 3.0 ) * 
                    ( 29.0 / 6.0 ) * ( 29.0 / 6.0 ) * t +
                    4.0 / 29.0;
            }
        }

        var X = f( clr.values[0] / WHITE.X );
        var Y = f( clr.values[1] / WHITE.Y );
        var Z = f( clr.values[2] / WHITE.Z );

        return new Colour( Colour.LABA, 
            [116 * Y - 16,
             500 * ( X - Y ),
             200 * ( Y - Z ),
             clr.values[3] ] );
    }

    /**
      @param {Colour} clr
      @return {Colour}
     */ 
    function convert_LABA_XYZA( clr )
    {
        var fy = ( clr.values[0] + 16 ) / 116;
        var fx = fy + clr.values[1] / 500;
        var fz = fy - clr.values[2] / 200;

        var squiggle = 6.0 / 29;
        var X, Y, Z;

        if ( fy > squiggle ) {
            Y = WHITE.Y * fy * fy * fy;
        } else {
            Y = ( fy - 16.0 / 116 ) * 3 * squiggle * squiggle * WHITE.Y;
        }

        if ( fx > squiggle ) {
            X = WHITE.X * fx * fx * fx;
        } else {
            X = ( fx - 16.0 / 116 ) * 3 * squiggle * squiggle * WHITE.X;
        }

        if ( fz > squiggle ) {
            Z = WHITE.Z * fz * fz * fz;
        } else {
            Z = ( fz - 16.0 / 116 ) * 3 * squiggle * squiggle * WHITE.Z;
        }

        return new Colour( Colour.XYZA, [X, Y, Z, clr.values[3]] );
    }

    /**
      @param {Colour} rgb
      @return {Colour}
     */ 
    function convert_RGBA_XYZA( rgb )
    {
        var temp = [];

        for ( var i = 0; i < 3; i++ ) {
            if ( rgb.values[i] <= 0.04045 ) {
                temp[i] = rgb.values[i] / 12.92;
            } else {
                temp[i] = Math.pow( (rgb.values[i]+0.055)/1.055, 2.4 );
            }
        }

        return new Colour( Colour.XYZA, [
            0.4124*temp[0]+0.3576*temp[1]+0.1805*temp[2],
            0.2126*temp[0]+0.7152*temp[1]+0.0722*temp[2],
            0.0193*temp[0]+0.1192*temp[1]+0.9505*temp[2],
            rgb.values[3] ] );
    }

    /**
      @param {Colour} xyz
      @return {Colour}
     */ 
    function convert_XYZA_RGBA( xyz )
    {
        var temp = [];
        var values = [];

        temp[0] =  3.2410 * xyz.values[0] - 1.5374 * xyz.values[1] - 0.4986 * xyz.values[2];
        temp[1] = -0.9692 * xyz.values[0] + 1.8760 * xyz.values[1] + 0.0416 * xyz.values[2];
        temp[2] =  0.0556 * xyz.values[0] - 0.2040 * xyz.values[1] + 1.0570 * xyz.values[2];

        for ( var i = 0; i < 3; i++ ) {
            if ( temp[i] <= 0.0031308 ) {
                values[i] = 12.92 * temp[i];
            } else {
                values[i] = 1.055 * Math.pow( temp[i], 1.0 / 2.4 ) - 0.055;
            }
        }

        values[3] = xyz.values[3];

        return new Colour( Colour.RGBA, values );
    }

    /**
      @param {Colour} clr
      @return {Colour}
     */ 
    function convert_SAME( clr )
    {
        return new Colour( clr.type, clr.values.concat() );
    }

    /**
      @param {Colour} clr
      @return {Colour}
     */ 
    function convert_RGBA_LABA( clr )
    {
        return convert_XYZA_LABA( 
            convert_RGBA_XYZA( clr ) );
    }

    /**
      @param {Colour} clr
      @return {Colour}
     */ 
    function convert_LABA_RGBA( clr )
    {
        return convert_XYZA_RGBA( 
            convert_LABA_XYZA( clr ) );
    }

    /**
      @param {Colour} clr
      @return {Colour}
     */ 
    function convert_XYZA_HSVA( clr )
    {
        return convert_RGBA_HSVA( 
            convert_XYZA_RGBA( clr ) );
    }

    /**
      @param {Colour} clr
      @return {Colour}
     */ 
    function convert_HSVA_XYZA( clr )
    {
        return convert_RGBA_XYZA( 
            convert_HSVA_RGBA( clr ) );
    }

    /**
      @param {Colour} clr
      @return {Colour}
     */ 
    function convert_HSVA_LABA( clr )
    {
        return convert_RGBA_LABA( 
            convert_HSVA_RGBA( clr ) );
    }

    /**
      @param {Colour} clr
      @return {Colour}
     */ 
    function convert_LABA_HSVA( clr )
    {
        return convert_XYZA_HSVA( 
            convert_LABA_XYZA( clr ) );
    }

    Colour.converters = [
        [ convert_SAME,
          convert_RGBA_XYZA,
          convert_RGBA_HSVA,
          convert_RGBA_LABA ],

        [ convert_XYZA_RGBA,
          convert_SAME,
          convert_XYZA_HSVA,
          convert_XYZA_LABA ],

        [ convert_HSVA_RGBA,
          convert_HSVA_XYZA,
          convert_SAME,
          convert_HSVA_LABA ],

        [ convert_LABA_RGBA,
          convert_LABA_XYZA,
          convert_LABA_HSVA,
          convert_SAME ]
  ];
}());

Colour.CssColours = {
    "aliceblue": "#f0f8ff",
    "antiquewhite": "#faebd7",
    "aqua": "#00ffff",
    "aquamarine":  "#7fffd4",
    "azure":  "#f0ffff",
    "beige":  "#f5f5dc",
    "bisque":  "#ffe4c4",
    "black":  "#000000",
    "blanchedalmond":  "#ffebcd",
    "blue":  "#0000ff",
    "blueviolet":  "#8a2be2",
    "brown":  "#a52a2a",
    "burlywood":  "#deb887",
    "cadetblue":  "#5f9ea0",
    "chartreuse":  "#7fff00",
    "chocolate":  "#d2691e",
    "coral":  "#ff7f50",
    "cornflowerblue":  "#6495ed",
    "cornsilk":  "#fff8dc",
    "crimson":  "#dc143c",
    "cyan":  "#00ffff",
    "darkblue":  "#00008b",
    "darkcyan":  "#008b8b",
    "darkgoldenrod":  "#b8860b",
    "darkgray":  "#a9a9a9",
    "darkgreen":  "#006400",
    "darkkhaki":  "#bdb76b",
    "darkmagenta":  "#8b008b",
    "darkolivegreen":  "#556b2f",
    "darkorange":  "#ff8c00",
    "darkorchid":  "#9932cc",
    "darkred":  "#8b0000",
    "darksalmon":  "#e9967a",
    "darkseagreen":  "#8fbc8f",
    "darkslateblue":  "#483d8b",
    "darkslategray":  "#2f4f4f",
    "darkturquoise":  "#00ced1",
    "darkviolet":  "#9400d3",
    "deeppink":  "#ff1493",
    "deepskyblue":  "#00bfff",
    "dimgray":  "#696969",
    "dodgerblue":  "#1e90ff",
    "firebrick":  "#b22222",
    "floralwhite":  "#fffaf0",
    "forestgreen":  "#228b22",
    "fuchsia":  "#ff00ff",
    "gainsboro":  "#dcdcdc",
    "ghostwhite":  "#f8f8ff",
    "gold":  "#ffd700",
    "goldenrod":  "#daa520",
    "gray":  "#808080",
    "green":  "#008000",
    "greenyellow":  "#adff2f",
    "honeydew":  "#f0fff0",
    "hotpink":  "#ff69b4",
    "indianred":   "#cd5c5c",
    "indigo":   "#4b0082",
    "ivory":  "#fffff0",
    "khaki":  "#f0e68c",
    "lavender":  "#e6e6fa",
    "lavenderblush":  "#fff0f5",
    "lawngreen":  "#7cfc00",
    "lemonchiffon":  "#fffacd",
    "lightblue":  "#add8e6",
    "lightcoral":  "#f08080",
    "lightcyan":  "#e0ffff",
    "lightgoldenrodyellow":  "#fafad2",
    "lightgreen":  "#90ee90",
    "lightgrey":  "#d3d3d3",
    "lightpink":  "#ffb6c1",
    "lightsalmon":  "#ffa07a",
    "lightseagreen":  "#20b2aa",
    "lightskyblue":  "#87cefa",
    "lightslategray":  "#778899",
    "lightsteelblue":  "#b0c4de",
    "lightyellow":  "#ffffe0",
    "lime":  "#00ff00",
    "limegreen":  "#32cd32",
    "linen":  "#faf0e6",
    "magenta":  "#ff00ff",
    "maroon":  "#800000",
    "mediumaquamarine":  "#66cdaa",
    "mediumblue":  "#0000cd",
    "mediumorchid":  "#ba55d3",
    "mediumpurple":  "#9370d8",
    "mediumseagreen":  "#3cb371",
    "mediumslateblue":  "#7b68ee",
    "mediumspringgreen":  "#00fa9a",
    "mediumturquoise":  "#48d1cc",
    "mediumvioletred":  "#c71585",
    "midnightblue":  "#191970",
    "mintcream":  "#f5fffa",
    "mistyrose":  "#ffe4e1",
    "moccasin":  "#ffe4b5",
    "navajowhite":  "#ffdead",
    "navy":  "#000080",
    "oldlace":  "#fdf5e6",
    "olive":  "#808000",
    "olivedrab":  "#6b8e23",
    "orange":  "#ffa500",
    "orangered":  "#ff4500",
    "orchid":  "#da70d6",
    "palegoldenrod":  "#eee8aa",
    "palegreen":  "#98fb98",
    "paleturquoise":  "#afeeee",
    "palevioletred":  "#d87093",
    "papayawhip":  "#ffefd5",
    "peachpuff":  "#ffdab9",
    "peru":  "#cd853f",
    "pink":  "#ffc0cb",
    "plum":  "#dda0dd",
    "powderblue":  "#b0e0e6",
    "purple":  "#800080",
    "red":  "#ff0000",
    "rosybrown":  "#bc8f8f",
    "royalblue":  "#4169e1",
    "saddlebrown":  "#8b4513",
    "salmon":  "#fa8072",
    "sandybrown":  "#f4a460",
    "seagreen":  "#2e8b57",
    "seashell":  "#fff5ee",
    "sienna":  "#a0522d",
    "silver":  "#c0c0c0",
    "skyblue":  "#87ceeb",
    "slateblue":  "#6a5acd",
    "slategray":  "#708090",
    "snow":  "#fffafa",
    "springgreen":  "#00ff7f",
    "steelblue":  "#4682b4",
    "tan":  "#d2b48c",
    "teal":  "#008080",
    "thistle":  "#d8bfd8",
    "tomato":  "#ff6347",
    "turquoise":  "#40e0d0",
    "violet":  "#ee82ee",
    "wheat":  "#f5deb3",
    "white":  "#ffffff",
    "whitesmoke":  "#f5f5f5",
    "yellow":  "#ffff00",
    "yellowgreen":  "#9acd32"
};
