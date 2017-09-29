'use strict';

var obtains = [
  'µ/midi.js',
  './src/neopixels.js',
  './src/server/express.js',
  './src/server/wsServer.js',
];

obtain(obtains, (midi, { pixels }, { fileServer }, { wss })=> {//, './src/LEDs.js'
  exports.app = {};

  pixels.init(88);

  var keyStyles = [];

  for (var i = 0; i < pixels.data.length; i++) {
    if (i < 48) keyStyles[i] = { mode: 'fade', color: [127, 0, 0] };
    else keyStyles[i] = { mode: 'rainbow', start: 48, end: 80 };
  }

  var admin = null;

  wss.addListener('setLights', (dataSet, data)=> {
    if (dataSet.length == pixels.data.length) {
      pixels.setEachRGB((val, ind)=>dataSet[ind]);
      pixels.show();
    }
  });

  wss.addListener('adminSession', (password, data, client)=> {
    //console.log(password);
    if (password == 'password') {
      console.log('admin connected');
      admin = client;
    }
  });

  wss.addListener('keyStyle', (set, data, client)=> {
    if (client === admin) {
      //set.key;
    }
  });

  var process = require('electron').remote.process;

  process.on('SIGINT', function () {
    pixels.reset();
    process.nextTick(function () { process.exit(0); });
  });

  exports.app.start = ()=> {
    console.log('started');

    setTimeout(()=> {
      pixels.setEachRGB(()=>[0, 0, 0]);
      pixels.show();

      //LEDs.show();
    }, 1000);

    midi.in.onReady = ()=> {
      var newIn = null;
      midi.in.devices.forEach((el)=> {
        //console.log(el.name);
        if (!el.name.includes('Through') && !newIn) {
          newIn = el;
          console.log(el.name);
        }
      });
      midi.in.select(newIn);
    };

    /*midi.out.onReady = ()=> {
      var newOut = null;
      midi.out.devices.forEach((el)=> {
        if (el.name.includes('Tesla') && !newOut) {
          newOut = el;
          console.log(el.name);
        }
      });
      midi.out.select(newOut);
    };*/

    var lightStates = [];

    var fadeVal = 0;

    var noteOn = [];

    var fadeTO = null;

    var fadeOut = (col)=> {
      clearTimeout(fadeTO);
      fadeVal -= .05;
      if (fadeVal <= 0) fadeVal = 0;
      pixels.setEachRGB(
        (cur, ind)=>
          (noteOn[ind]) ? [cur.r, cur.g, cur.b] : col.map((val)=>val * fadeVal)
      );
      pixels.show();
      if (fadeVal > 0) fadeTO = setTimeout(()=>fadeOut(col), 50);
    };

    var onThenFade = (vel, color)=> {
      fadeVal = vel / 127.;
      fadeOut(color);
    };

    var rainbowRGB = (note, span)=> {
      const third = span / 3;
      var r = 1, g = 0, b = 0;
      var c = note % span;
      var k = 255 - (note % third) * (255 / third);
      if (c >= 2 * third) r = 0, g = 0, b = 1;
      else if (c >= third) r = 0, g = 1, b = 0;
      else r = 1, g = 0, b = 0;

      return { r: (r * (255 - k) + g * k), g: (g * (255 - k) + b * k), b: (b * (255 - k) + r * k) };
    };

    midi.in.setNoteHandler((note, vel)=> {
      if (note > 0 && note < 88) {

        //if (vel > 0) midi.out.playNote(note, 1);
        //if (vel == 0) midi.out.playNote(note, 0);

        if (vel) admin.sendPacket({ notePressed: note });

        var s = vel / 127.;

        /*if (note >= 48) {
          if (vel) {
            noteOn[note] = true;
            var rbow = rainbowRGB(note - 48, 32);
            pixels.set(note, s * rbow.r, s * rbow.g, s * rbow.b);
            pixels.show();
          } else {
            noteOn[note] = false;
            pixels.set(note, 0, 0, 0);
            pixels.show();
          }
        } else {
          if (vel) onThenFade(vel);
        }*/
        switch (keyStyles[note].mode) {
          case 'fade':
            if (vel) onThenFade(vel, keyStyles[note].color);
            break;
          case 'rainbow': {
            var st = keyStyles[note].start;
            var end = keyStyles[note].end;
            var rbow = rainbowRGB(note - st, end - st);
            pixels.set(note, s * rbow.r, s * rbow.g, s * rbow.b);
            pixels.show();
          }

            break;
          default:

        }
      }
    });

    document.onkeyup = (e)=> {
      if (e.which == 27) {
        var electron = require('electron');
        electron.remote.process.exit();
      }
    };

  };

  provide(exports);
});
