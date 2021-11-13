/**
 * jsui script for Retro-nome
 * @author h1data
 * @version 1.0.0
 * @since November, 2021
 */
autowatch = 1;
inlets = 1;
outlets = 1;

var TWOPI = 2*Math.PI;
var NUM_BAR = 180;
var NUM_BAR_HALF = 91;
var NEEDLE_ANGLE = 0.45;
var BALL_SIZE = 5.5;
var ALPHA_AFT = 0.47;
var index = [-1, -1, -1];
var isActive = false;

var coords = {
  origin: [126, 163],
  ball: new Array(NUM_BAR),
  dial: {
    l: new Array(NUM_BAR),
    r: new Array(NUM_BAR),
  }
};

var colors = {
  fg: [0.952941, 0.376471, 0., 1.], // value_arc
  bg: [0.094118, 0.117647, 0.137255, 1.],  // lcd_bg
  aft: new Array(NUM_BAR_HALF),
};

/**
 * pre-calculate for coordinates and colors of after image
 */
function init() {
  var delta = degToRad(NEEDLE_ANGLE);
  for (var i=0; i<NUM_BAR_HALF; i++) {
    var deg = 40.7 + 98.61 * i / (NUM_BAR_HALF - 1);
    var rad = degToRad(deg);
    coords.ball[i] = [coords.origin[0] - 153 * Math.cos(rad), coords.origin[1] - 153 * Math.sin(rad)];
    coords.dial.l[i] = [coords.origin[0] - 148 * Math.cos(rad - delta),
                        coords.origin[1] - 148 * Math.sin(rad - delta)];
    coords.dial.r[i] = [coords.origin[0] - 148 * Math.cos(rad + delta),
                        coords.origin[1] - 148 * Math.sin(rad + delta)];
    
    if (i != 0 && i != (NUM_BAR_HALF-1)) {  // copy 0-88 to 179-90
      coords.ball[NUM_BAR - i] = coords.ball[i];
      coords.dial.l[NUM_BAR - i] = coords.dial.l[i];
      coords.dial.r[NUM_BAR - i] = coords.dial.r[i];
    }
  }
  setAftColor();

  // ready
  outlet(0, 1);

  function degToRad(deg) {
    return deg/180*Math.PI;
  }
}

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

function active(attr) {
  isActive = attr;
  index[1] = -1;
  index[2] = -1;
  if (!isActive) mgraphics.redraw();
} 

function setFgColor(r, g, b, a) {
  colors.fg = [r, g, b, a];
  setAftColor();
}

function setBgColor(r, g, b, a) {
  colors.bg = [r, g, b, a];
  setAftColor();
}

setAftColor.local = 1;
function setAftColor() {
  for (var i=0; i<NUM_BAR_HALF; i++) {
    colors.aft[i] = [
      (colors.fg[0] * ALPHA_AFT * i + colors.bg[0] * (NUM_BAR_HALF - i) ) / (NUM_BAR_HALF+1),
      (colors.fg[1] * ALPHA_AFT * i + colors.bg[1] * (NUM_BAR_HALF - i) ) / (NUM_BAR_HALF+1),
      (colors.fg[2] * ALPHA_AFT * i + colors.bg[2] * (NUM_BAR_HALF - i) ) / (NUM_BAR_HALF+1),
      1.0
    ];
  }
}

function msg_float(value) {
  index[0] = value;
  mgraphics.redraw();
}

paint.local = 1;
function paint() {
  if (isActive) {

    // after image
    if (index[2] != -1) {
      if (index[0] > index[2]) {
        var length = index[0] - index[2];
        for (var i=0; i<length; i++) {
          drawDial(index[2] + i, colors.aft[Math.round(i / length * NUM_BAR_HALF)]);
        }
      } else {
        var length = NUM_BAR + index[0] - index[2];
        for (var i=0; i<length; i++) {
          drawDial((index[2] + i) % NUM_BAR, colors.aft[Math.round(i / length * NUM_BAR_HALF)]);
        }
      }
    }

    // current position
    drawDial(index[0], colors.fg);

    // update past indexes
    index[2] = index[1];
    index[1] = index[0];

  }

  function drawDial(i, r, g, b, a) {
    with (mgraphics) {
      // dial
      set_source_rgba(r, g, b, a);
      move_to(coords.dial.l[i]);
      line_to(coords.origin);
      line_to(coords.dial.r[i]);
      line_to(coords.dial.l[i]);
      fill();

      // ball
      arc(coords.ball[i], BALL_SIZE, 0, TWOPI);
      fill();
    }
  }
}
