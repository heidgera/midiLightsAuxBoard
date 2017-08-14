global.obtain = (addr, func)=> {
  var _this = this;
  addr.replace('µ', './common/src/muse/');
  var objs = [];
  if (addr.length <= 0) func();
  else {
    addr.forEach(function(adr, ind, arr) {
      objs[ind] = require(adr);
    });

    func.apply(null, objs);
  };

};

//require('./common/src/muse/SerialElectron.js');
obtain(['./local/LEDs.js'], ({ LEDs })=> {
  setInterval(()=> {
    LEDs.indicatorOn();
    setTimeout(()=> {
      LEDs.indicatorOff();
    });
  }, 1000);
});
