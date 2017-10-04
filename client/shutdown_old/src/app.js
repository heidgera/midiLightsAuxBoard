'use strict';

obtain(['child_process'], ({ exec })=> {
  exports.app = {};

  //var control = new MuseControl(window.location.hostname);

  exports.app.start = ()=> {
    exec('sudo shutdown now', (err, stdout, stderr)=> {});
  };

  provide(exports);
});
