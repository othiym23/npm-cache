var assert = require('assert');
var path   = require('path');

var fs                = require('graceful-fs');
var chmod             = fs.chmod;
var createReadStream  = fs.createReadStream;
var createWriteStream = fs.createWriteStream;
var mkdtemp           = require('tmp').dir;

module.exports = _unpackTarball;

function _unpackTarball(tarball, callback) {
  assert(tarball, "must pass path to tarball");

  var cache = this;

  mkdtemp({}, function (error, tmpdir) {
    if (error) return callback(error);

    var tmpfile = path.join(tmpdir, 'tmp.tgz');
    var from = createReadStream(tarball);
    var to = createWriteStream(tmpfile);

    var errored;
    function onError(error) {
      if (errored) return;
      errored = error;
      callback(error);
    }
    from.on('error', onError);
    to.on('error',   onError);

    to.on('close', function () {
      if (errored) return;

      chmod(tmpfile, cache.fileMode, function (error) {
        if (error) return callback(error);

        callback(null);
      });
    });

    from.pipe(to);
  });
}
