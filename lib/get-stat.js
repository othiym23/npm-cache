var assert = require('assert');

var fs       = require('graceful-fs');
var stat     = fs.stat;
var inflight = require('inflight');

module.exports = _getStat;

var cacheStat;
function _getStat(callback) {
  assert(typeof callback === 'function', "must pass callback");

  if (cacheStat) return callback(null, cacheStat);

  callback = inflight("getCacheStat", callback);
  if (!callback) return;

  var cache = this;
  stat(this.location, function (error, st) {
    if (error) return callback(error);

    if (!st.isDirectory()) {
      console.error("getCacheStat", "invalid cache dir %j", cache.location);
      return callback(error);
    }

    cacheStat = st;
    return callback(null, st);
  });
}
