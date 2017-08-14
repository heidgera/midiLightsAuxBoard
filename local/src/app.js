'use strict';

obtain(['µ/midi.js', './src/LEDs.js'], (midi, { LEDs })=> {//, './src/LEDs.js'
  exports.app = {};

  exports.app.start = ()=> {
    console.log('started');

    setTimeout(()=> {
      LEDs.setMaxLEDs(145);
      LEDs.setColorRange(0, 144, 0, 0, 0);
      LEDs.show();
    }, 1000);

    console.log(midi.in.devices);

    midi.in.onReady = ()=> {
      var newIn = null;
      midi.in.devices.forEach((el)=> {
        if (el.name.includes('Axiom') && !newIn) newIn = el;
        console.log(el.name);
      });
      midi.in.selectMIDIIn(newIn);
    };

    var midiStates = [];

    midi.in.setNoteHandler((note, vel)=> {
      if (note > 0 && note < 88) {
        //console.log('Note ' + note + ' pressed at ' + vel);
        /*var r = 1, g = 0, b = 0;
        var c = note % 12;
        var k = (note % 4) * vel / 4;
        if (c > 8) r = 0, g = 1, b = 0;
        else if (c > 4) r = 0, g = 0, b = 1;
        else r = 1, g = 0, b = 0;
        LEDs.setColor(note, r * (vel - k) + b * k, g * (vel - k) + r * k, b * (vel - k) + g * k);*/
        midiStates[note] = vel;
        LEDs.setColor(note, vel, vel, vel);
        LEDs.show();
      }
    });

    setInterval(()=> {
      //LEDs.indicatorOn();
      //setTimeout(LEDs.indicatorOff, 500);
      midiStates.forEach((item, ind)=> {
        LEDs.setColor(ind, item, item, item);
      });
      LEDs.show();
    }, 2000);

    document.onkeypress = (e)=> {
      if (e.key == ' ') console.log('Space pressed');
    };

  };

  provide(exports);
});
