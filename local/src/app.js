'use strict';

obtain(['µ/midi.js', './src/neopixels.js'], (midi, { pixels })=> {//, './src/LEDs.js'
  exports.app = {};

  pixels.init(88);

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
        if (el.name.includes('Axiom') && !newIn) {
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

    var midiStates = [];

    var fadeVal = 0;

    var noteOn = [];

    var fadeTO = null;

    var fadeOut = ()=> {
      clearTimeout(fadeTO);
      fadeVal -= .05;
      pixels.setEachRGB(
        (cur, ind)=>(noteOn[ind]) ? [cur.r, cur.g, cur.b] : [fadeVal * 1, 0, 0]
      );
      if (fadeVal > 0) fadeTO = setTimeout(fadeOut, 50);
    };

    var onThenFade = (vel)=> {
      fadeVal = vel / 127.;
      fadeOut();
    };

    midi.in.setNoteHandler((note, vel)=> {
      if (note > 0 && note < 88) {

        //if (vel > 0) midi.out.playNote(note, 1);
        //if (vel == 0) midi.out.playNote(note, 0);

        //console.log('Note ' + note + ' pressed at ' + vel);
        var r = 1, g = 0, b = 0;
        var c = note % 88;
        var k = (note % 30) * 8.5;
        if (c > 60) r = 0, g = 1, b = 0;
        else if (c > 30) r = 0, g = 0, b = 1;
        var s = vel / 127.;

        if (note > 48) {
          if (vel) {
            noteOn[note] = true;
            pixels.set(note, s * (r * (255 - k) + b * k), s * (g * (255 - k) + r * k), s * (b * (255 - k) + g * k));
            pixels.show();
          } else {
            noteOn[note] = false;
            pixels.set(note, 0, 0, 0);
            pixels.show();
          }
        } else {
          if (vel) onThenFade(vel);
        }

        //midiStates[note] = vel;
        //LEDs.setColor(note, vel, vel, vel);
        //LEDs.show();
      }
    });

    /*setInterval(()=> {
      pixels.set(0, 255, 0, 0);
      pixels.show();

      setTimeout(()=> {
        pixels.setEach(()=>0);
        pixels.show();
      }, 500);
    }, 1000);*/

    document.onkeypress = (e)=> {
      if (e.key == ' ') console.log('Space pressed');
    };

  };

  provide(exports);
});
