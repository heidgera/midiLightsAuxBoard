'use strict';

var obtains = [
  'µ/midi.js',
  './src/neopixels.js',
  './src/server/express.js',
  './src/server/wsServer.js',
];

obtain(obtains, (midi, { pixels, rainbow, Color }, { fileServer }, { wss })=> {
  exports.app = {};

  pixels.init(88);

  var mkOff = 9; //Piano keyboards start at midi 9

  var keyStyles = [];

  for (var i = 0; i < pixels.data.length; i++) {
    if (i < 48) keyStyles[i] = { mode: 'fade', color: new Color([127, 0, 0]) };
    else keyStyles[i] = { mode: 'rainbow', start: 48, end: 80, color: rainbow(i - 48, 32) };
  }

  var admin = null;

  var noteHeld = [];

  var Chord = function (cKeys, config) {
    this.keys = cKeys;
    let keypresses = [];
    this.config = config;

    let timer = null;

    let reset = ()=> {
      keypresses = [];
    };

    var fired = false;

    var allPressed = ()=>this.keys.reduce((acc, v, i)=>acc && keypresses[i], true);

    this.launch = ()=> {
      var scale = this.keys.reduce((acc, v, i)=>acc + keypresses[i], 0) / this.keys.length;
      setLightsFromConfig(this.config, scale);
    };

    this.check = (note, vel)=> {
      var ind = this.keys.indexOf(note);
      if (ind > -1) {
        keypresses[ind] = vel;
        clearTimeout(timer);
        if (!fired && allPressed()) this.launch();
        else if (vel && !fired) timer = setTimeout(reset, 250);
        fired = allPressed();
      }
    };
  };

  var holdColor = [];

  var fadeVal = 0;

  var fadeTO = null;

  var fadeOut = (col)=> {
    clearTimeout(fadeTO);
    fadeVal -= .05;
    if (fadeVal <= 0) fadeVal = 0;
    pixels.setEachRGB(
      (cur, ind)=>(holdColor[ind]) ? cur : col.scale(fadeVal)
    );
    pixels.show();
    if (fadeVal > 0) fadeTO = setTimeout(()=>fadeOut(col), 50);
  };

  var onThenFade = (vel, color)=> {
    fadeVal = vel / 127.;
    fadeOut(color);
  };

  var setLightsFromConfig = (cfg, s, note, range)=> {
    switch (cfg.mode) {
      case 'fade':
        if (vel) onThenFade(vel, cfg.color);
        break;
      case 'color':
        if (note) {
          holdColor[note] = vel;
          pixels.setByArray(note, cfg.color.scale(s));
        } else if (cfg.range) {
          for (var i = cfg.range.low; i < cfg.range.high; i++) {
            pixels.setByArray(i, cfg.color.scale(s));
          }
        }

        pixels.show();
        break;
      case 'pulse':

        //code for pulse
        break;
      default:

    }
  };

  wss.addListener('setLights', (dataSet, data)=> {
    if (dataSet.length == pixels.data.length) {
      pixels.setEachRGB((val, ind)=>dataSet[ind]);
      pixels.show();
    }
  });

  wss.addListener('requestMIDIDevices', (request, data, client)=> {
    if (client === admin) {
      var mid = (request == 'input') ? midi.in : midi.out;
      admin.sendPacket({
        listMIDI: {
          which: request,
          devices: mid.devices.map((dev)=>dev.name),
        },
      });
    }
  });

  wss.addListener('getConfiguration', (span, data, client)=> {
    if (client === admin) admin.sendPacket({
      keyConfig: keyStyles,
    });
  });

  /*wss.addListener('getChords', (reply, data, client)=> {
    if (client === admin) admin.sendPacket({
      serverChords: chords,
    });
  });

  wss.addListener('setChords', (clientChords, data, client)=> {
    if (client === admin) chords.set(clientChords);
  });*/

  wss.addListener('setConfiguration', (config, data, client)=> {
    if (client === admin) {
      config.forEach(function (cfg, ind, arr) {
        cfg.color = (cfg.color) ?
          new Color(cfg.color) :
          rainbow(ind - cfg.start, cfg.end - cfg.start);
      });

      keyStyles = config;
    }
  });

  wss.addListener('adminSession', (password, data, client)=> {
    //console.log(password);
    if (password == 'password') {
      console.log('admin connected');
      admin = client;
    }
  });

  var setStyle = (set, key, which)=> {
    if (set.hasOwnProperty(key) && key != 'key') {
      if (key == 'color') keyStyles[which][key] = new Color(set[key]);
      else keyStyles[which][key] = set[key];
    }
  };

  wss.addListener('keyMode', (set, data, client)=> {
    if (client === admin) {
      if (!set.range) {
        for (var key in set) setStyle(set, key, set.key);
      } else for (var key in set) {
        for (var i = set.range.low; i < set.range.high + 1; i++) {
          setStyle(set, key, i);
        }
      }
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

    midi.in.setNoteHandler((note, vel)=> {
      if (note >= 9 && note < 97) {
        note -= 9;

        //if (vel > 0) midi.out.playNote(note, 1);
        //if (vel == 0) midi.out.playNote(note, 0);

        if (admin) admin.sendPacket({ notePressed: { note: note, vel: vel } });

        var s = vel / 127.;
        noteHeld[note] = vel;

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
          case 'color':
            holdColor[note] = vel;
            pixels.setByArray(note, keyStyles[note].color.scale(s));
            pixels.show();
            break;

          // case 'rainbow': {
          //   holdColor[note] = vel;
          //   var st = keyStyles[note].start;
          //   var end = keyStyles[note].end;
          //   var rbow = rainbow(note - st, end - st);
          //   pixels.set(note, rbow.scale(s));
          //   pixels.show();
          // }
          //
          //   break;
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
