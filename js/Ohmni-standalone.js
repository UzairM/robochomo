window.OhmniNative = window.OhmniNative || {};

window.Ohmni = new function() {
  this._events_handler = {};
  this.OhmniCid = 0;
  this.OhmniCbHandler = {};

  // Add all methods of OhmniNative to Ohmni.
  for (var prop in OhmniNative) {
    var tempOhmni = OhmniNative;
    if (typeof OhmniNative[prop] == 'function') {
      this[prop] = function() {
        var args = [].slice.call(arguments);
        var fnName = args[0];
        args.splice(0, 1);
        return OhmniNative[fnName].apply(OhmniNative, args);
      }.bind(null, prop);
    }
  }

  /* --- HELPER METHODS FOR CALLBACK ------BETWEEN JAVASCRIPT INTERFACE & JAVA -----*/
  this.OhmniCallback = function(id, args) {
    var fn = this.OhmniCb[id];
    if (fn != null) {
      fn.apply(null, args);
    }
  };

  this.cbRequestBotInfo = function(data, id = "bot_info") {
    cbRequestBotInfo(data);
  };

  this.OhmniCallbackOnce = function(id, args) {
    var fn = this.OhmniCbHandler[id];
    if (fn != null) {
      fn.apply(null, args);
      delete this.OhmniCbHandler[id];
    }
  };

  this.ocb = function(fn) {
    const idstr = this.OhmniCid + "";
    this.OhmniCid += 1;
    this.OhmniCbHandler[idstr] = fn;
    return idstr;
  };

  /* Methods that need callback need to be handled*/
  this.say = function(str, cb) {
    const cbid = this.ocb(cb);
    OhmniNative.say(str, cbid);
  };

  this.sendBotshellCmd = function(cmdData) {
    OhmniNative.sendBotshellCmd(JSON.stringify(cmdData));
  };

  this.bindSpeechHandler = function(str, cb) {
    const cbid = this.ocb(cb);
    OhmniNative.bindSpeechHandler(str, cbid);
  };

  this.HandleIncomingData = function(data) {
    this.emit('cdata', data);
  };

  this.on = function(event, handler) {
    this._events_handler[event] = handler;
  };

  this.emit = function(ename) {
    if (this._events_handler[ename] != null) {
      console.log(arguments);
      this._events_handler[ename].apply(null, Array.from(arguments).slice(1));
    }
  };
}; 