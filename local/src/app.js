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
      //LEDs.setColorRange(0, 144, 0, 0, 0);
      pixels.setEach(()=>0);
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

    midi.in.setNoteHandler((note, vel)=> {
      if (note > 0 && note < 88) {
        console.log('here');

        //if (vel > 0) midi.out.playNote(note, 1);
        //if (vel == 0) midi.out.playNote(note, 0);

        //console.log('Note ' + note + ' pressed at ' + vel);
        var r = 1, g = 0, b = 0;
        var c = note % 12;
        var k = (note % 4) * vel / 4;
        if (c > 8) r = 0, g = 1, b = 0;
        else if (c > 4) r = 0, g = 0, b = 1;
        else r = 1, g = 0, b = 0;

        if (vel) {
          pixels.set(note, r * (vel - k) + b * k, g * (vel - k) + r * k, b * (vel - k) + g * k);
          pixels.show();
        } else {
          pixels.set(note, 0, 0, 0);
          pixels.show();
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
