'use strict';

obtain(['µ/commandClient.js'], ({ MuseControl })=> {
  exports.app = {};

  var control = new MuseControl(window.location.hostname);

  exports.app.start = ()=> {

    control.connect();

    control.onConnect = ()=> {
      console.log('Connecting to server...');
      control.send({ adminSession: 'password' });
    };

    control.addListener('notePressed', (note)=> {
      console.log(`${note} was pressed on the master`);
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
      }
    };

  };

  provide(exports);
});
