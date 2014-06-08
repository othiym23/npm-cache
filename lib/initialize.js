var lstat = require('fs').lstat;

var mkdirp = require('mkdirp');

module.exports = initialize;

function initialize(callback) {
  var cache = this;

  lstat(this.location, function (error) {
    if (!error) return callback(null);
    if (error && error.code !== 'ENOENT') return callback(error);

    mkdirp(cache.location, callback);
  });
}
