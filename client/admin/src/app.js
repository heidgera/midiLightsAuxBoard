'use strict';

obtain(['µ/commandClient.js'], ({ MuseControl })=> {
  exports.app = {};

  var control = new MuseControl(window.location.hostname);

  exports.app.start = ()=> {

    var keyStyles = [];

    var rainbowRGB = (note, span)=> {
      const third = span / 3;
      var r = 1, g = 0, b = 0;
      var c = note % span;
      var k = 255 - (note % third) * (255 / third);
      if (c >= 2 * third) r = 0, g = 0, b = 1;
      else if (c >= third) r = 0, g = 1, b = 0;
      else r = 1, g = 0, b = 0;

      return [(r * (255 - k) + g * k), (g * (255 - k) + b * k), (b * (255 - k) + r * k)];
    };

    var holder = µ('#keyholder');
    var keys = [];

    for (var i = 0; i < 88; i++) {
      if (i < 48) keyStyles[i] = { mode: 'fade', color: [127, 0, 0] };
      else keyStyles[i] = { mode: 'rainbow', start: 48, end: 80 };
      keys.push(µ('+div', holder));
      keys[i].className = 'key';
      var col = (keyStyles[i].mode == 'rainbow') ? rainbowRGB(i - 48, 32).map(val=>Math.floor(val)) : [127, 0, 0];
      console.log(col);
      keys[i].style.backgroundColor = `rgb(${col[0]}, ${col[1]}, ${col[2]})`;
    }

    control.onConnect = ()=> {
      console.log('Connecting to server...');
      control.send({ adminSession: 'password' });
    };

    control.connect();

    control.addListener('notePressed', (note)=> {
      //console.log(`${note} was pressed on the master`);
    });

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
