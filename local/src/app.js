'use strict';

obtain(['µ/midi.js', './src/LEDs.js'], (midi, { LEDs })=> {//, './src/LEDs.js'
  exports.app = {};

  exports.app.start = ()=> {
    console.log('started');

    midi.in.setNoteHandler((note, vel)=> {
      if (note > 0 && note < 88) {
        console.log('Note ' + note + ' pressed at ' + vel);
      }
    });

    setInterval(()=> {
      LEDs.indicatorOn();
      setTimeout(LEDs.indicatorOff, 500);
    }, 1000);

    document.onkeypress = (e)=> {
      if (e.key == ' ') console.log('Space pressed');
    };

  };

  provide(exports);
});
