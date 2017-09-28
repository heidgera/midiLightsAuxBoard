obtain(['rpi-ws281x-native'], (ws2812)=> {
  exports.pixels = {
    init: function (numLEDs) {
      var _this = this;
      _this.data = new Uint32Array(numLEDs);
      ws2812.init(numLEDs);
    },

    color: (r, g, b)=>((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff),

    show: function () {
      console.log('try showing');
      ws2812.render(this.data);
    },

    set: function (num, r, g, b) {
      this.data[num] = this.color(r, g, b);
    },

    setEach: function (cb) { // cb in form of (ind,arr)
      this.data = this.data.map((val, ind, arr)=>cb(ind, arr));
    },

    reset: ws2812.reset,
  };
});
