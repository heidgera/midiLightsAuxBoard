
global.provide = ()=>{};

global.obtain = (addr, func)=> {
  var _this = this;
  //addr.replace('µ', './common/src/muse/');
  var objs = [];
  if (addr.length <= 0) func();
  else {
    addr.forEach(function(adr, ind, arr) {
      objs[ind] = require(adr.replace('µ', './common/src/muse/'));
    });

    func.apply(null, objs);
  };

};

//require('./common/src/muse/SerialElectron.js');
obtain(['./local/src/LEDs.js'], ({ LEDs })=> {
LEDs.setMaxLEDs(144);
  setInterval(()=> {
    LEDs.setColorRange(0, 143,1,0,1);
    LEDs.show();
    LEDs.indicatorOn();
    setTimeout(()=> {
      LEDs.indicatorOff();
      LEDs.setColorRange(0,143,0,1,0);
      LEDs.show();
    },500);
  }, 1000);
});
