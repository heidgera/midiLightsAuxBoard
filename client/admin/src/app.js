'use strict';

obtain(['µ/commandClient.js', 'µ/color.js', './src/keyboard.js'], ({ MuseControl }, { Color, rainbow }, { Keyboard, midiKeyOffset: mkOff })=> {
  exports.app = {};

  var control = new MuseControl(window.location.hostname);

  exports.app.start = ()=> {

    var keys = new Keyboard(µ('#keyholder'));

    var Chord = function (cKeys, config) {
      var name = cKeys.reduce((acc, val)=>
        acc + ((acc.length) ? '-' : '') + keys[val - mkOff].getAttribute('note').replace('_sharp', '#'), '');
      return {
        name: name,
        keys: cKeys,
        config: config,
      };
    };

    var chords = []; //new Chord([10, 14, 16], {})

    var currentChord = -1;

    keys.forEach(function (key, ind, arr) {
      if (key.midiNum < 48) key.lightStyle = { mode: 'fade', color: new Color([127, 0, 0]) };
      else key.lightStyle = { mode: 'rainbow', start: 48, end: 80 };
      if (key.lightStyle.mode == 'rainbow') {
        key.lightStyle.color = rainbow(key.midiNum - 48, 32);
      }

      key.style.backgroundColor = key.lightStyle.color.styleString();
    });

    control.onConnect = ()=> {
      console.log('Connecting to server...');
      control.send({ adminSession: 'password' });
    };

    control.connect();

    control.addListener('notePressed', (key)=> {
      if (key.vel && key.note >= mkOff) {
        keys[key.note - mkOff].toggle();
      }
    });

    control.addListener('listMIDI', (reply)=> {
      console.log(reply.devices);
    });

    control.addListener('serverChords', (servChrd)=> {
      //console.log(reply.devices);
      chords = [];
      servChrd.forEach(function (chrd, ind, arr) {
        chords.push(new Chord(chrd.keys, chrd.config));
      });
    });

    control.addListener('keyConfig', (config)=> {
      config.forEach(function (cfg, ind, arr) {
        cfg.color = (cfg.color) ?
          new Color(cfg.color) :
          rainbow(ind - cfg.start, cfg.end - cfg.start);
      });

      keys.forEach(function (key, ind, arr) {
        key.lightStyle = config[ind];
        key.style.backgroundColor = key.lightStyle.color.styleString();
      });
    });

    var getNum = el => isNaN(parseInt(el.value)) ? 0 : parseInt(el.value);

    var makeConfig = (which)=> {
      var cfg = {};
      cfg.mode = µ('[name="mode"]').reduce((acc, val)=>(val.checked ? val.value : acc), null);
      cfg.color = new Color([getNum(µ('#rCol')), getNum(µ('#gCol')), getNum(µ('#bCol'))]);
      cfg.range = { low: getNum(µ('#rangeStart')) - 9, high: getNum(µ('#rangeEnd')) - 9, mid: getNum(µ('#rangeMid')) - 9 };
      cfg.time = getNum(µ('#actTime'));
      cfg.rainbow = µ('#rainbow').checked;

      if (cfg.range.high - cfg.range.low <= 0) {
        cfg.range.high = 87;
        cfg.range.low = 0;
      }

      if (µ('#rainbow').checked) {
        var min = getNum(µ('#rbowMin'));
        var max = getNum(µ('#rbowMax'));
        cfg.color = rainbow(which - min, max - min);
        console.log(cfg.color);
      }

      return cfg;
    };

    µ('#read').onclick = (e)=> {
      e.preventDefault();
      control.send({ getConfiguration: { low: 0, high: 88 } });
      control.send({ getChords: true });
    };

    µ('#write').onclick = (e)=> {
      e.preventDefault();
      control.send({ setConfiguration: keys.map(key=>key.lightStyle) });
      control.send({ setChords: chords });
    };

    µ('#settings').onclick = (e)=> {
      e.preventDefault();
      control.send({ requestMIDIDevices: 'input' });
    };

    µ('#selectAll').onclick = (e)=> {
      e.preventDefault();
      keys.selectAll();
    };

    µ('#closeConfig').onclick = (e)=> {
      e.preventDefault();
      keys.deselectAll();
      µ('#configurator').hidden = true;
    };

    µ('#chords').onchange = ()=> {
      var val = µ('#chords').value;
      if (val >= 0) {
        keys.deselectAll(()=> {currentChord = val;});
        chords[val].keys.forEach(function (key, ind, arr) {
          keys[key - mkOff].select();
        });
      }
    };

    µ('#deleteChord').onclick = (e)=> {
      e.preventDefault();
      if (currentChord > -1) {
        chords.splice(currentChord, 1);
      }

      keys.deselectAll();

      µ('#configurator').hidden = true;
    };

    µ('#saveChord').onclick = (e)=> {
      e.preventDefault();

      var sKeys = keys.filter(val=>val.selected).map(val=>val.midiNum);
      console.log(sKeys);
      var cfg = makeConfig(getNum(µ('#rangeMid')));
      console.log(cfg);
      if (currentChord > -1 && sKeys.toString() == chords[currentChord].keys.toString()) {
        chords[currentChord] = new Chord(sKeys, cfg);
      } else {
        chords.push(new Chord(sKeys, cfg));
      }

      console.log(chords);

      keys.deselectAll();

      µ('#configurator').hidden = true;
    };

    µ('#saveClose').onclick = (e)=> {
      e.preventDefault();
      keys.deselectAll();
      µ('#configurator').hidden = true;
    };

    µ('#saveClose').onclick = (e)=> {
      e.preventDefault();

      keys.forEach(function (key, ind, arr) {
        if (key.selected) {
          key.lightStyle = makeConfig(ind);

          key.style.backgroundColor = key.lightStyle.color.styleString();
        }
      });

      keys.deselectAll();

      µ('#configurator').hidden = true;
    };

    keys.onSelect = (which)=> {
      µ('#configurator').hidden = false;
      if (chords.length) {
        var cDiv = µ('#chords');
        cDiv.innerHTML = '<option value = "-1">Select Chord</span>';
        chords.forEach(function (chord, ind, arr) {
          let newOpt = µ('+option', cDiv);
          newOpt.value = ind;
          newOpt.textContent = chord.name;
        });
      } else {
        var cDiv = µ('#chords');
        cDiv.innerHTML = '<option value = "-1">No Chords</span>';
      }

      µ('#whichKeys').textContent = keys.selectionString();
    };

    keys.onDeselect = (which)=> {
      if (keys.noneSelected()) currentChord = -1;
      µ('#configurator').hidden = keys.noneSelected();
      µ('#whichKeys').textContent = keys.selectionString();
    };

    var makeSampleColor = ()=> {
      var col = new Color([getNum(µ('#rCol')), getNum(µ('#gCol')), getNum(µ('#bCol'))]);
      µ('#sampleColor').style.backgroundColor = col.styleString();
    };

    µ('#rCol').onblur = makeSampleColor;
    µ('#gCol').onblur = makeSampleColor;
    µ('#bCol').onblur = makeSampleColor;

    µ('#rainbow').onchange = ()=> {
      if (µ('#rainbow').checked) {
        µ('#colorInputs').hidden = true;
        µ('#colorRange').hidden = false;
      } else {
        µ('#colorInputs').hidden = false;
        µ('#colorRange').hidden = true;
      }
    };

    var lights = [];

    for (var i = 0; i < 88; i++) {
      lights[i] = [0, 0, 0];
    }

    lights[44] = [255, 0, 0];

    document.onkeypress = (e)=> {
      if (e.key == ' ') console.log('Space pressed');
      else if (e.key == 'k') {
        control.send({ setLights: lights });
        console.log('Sent');
      } else if (e.key == 'j') {
        control.send({ keyMode: {
          key: 60,
          mode: 'fade',
          color: [0, 127, 0],
        }, });
      } else if (e.key == 'r') {
        control.send({ keyMode: {
          range: { low: 50, high: 59 },
          mode: 'color',
          color: [0, 0, 127],
        }, });
      }
    };

  };

  provide(exports);
});
