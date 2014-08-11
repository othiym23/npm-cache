var assert = require('assert');
var path   = require('path');

var fs                = require('graceful-fs');
var createReadStream  = fs.createReadStream;
var createWriteStream = fs.createWriteStream;
var writeFile         = fs.writeFile;
var chownr            = require('chownr');
var mkdirp            = require('mkdirp');
var once              = require('once');

module.exports = _placeTarball;

function _placeTarball(tarball, metadata, callback) {
  if (!metadata) metadata = {};

  assert(tarball,                        "must have tarball to place");
  assert(metadata._resolved,             "must have resolved source");
  assert(metadata._shasum,               "must have shasum");
  assert(metadata.name,                  "must have package name");
  assert(metadata.version,               "must have package version");
  assert(typeof callback === 'function', "must have callback function");

  callback = once(callback);

  var root     = path.resolve(this.location, metadata.name, metadata.version);
  var placed   = path.resolve(root, 'package.tgz');
  var pkg      = path.resolve(root, 'package');
  var manifest = path.resolve(pkg,  'package.json');

  this._getStat(function (error, cs) {
    if (error) return callback(error);

    mkdirp(pkg, function (error) {
      if (error) return callback(error);

      var from = createReadStream(tarball);
      var to   = createWriteStream(placed);

      from.on('error', callback);
      to.on('error',   callback);

      to.on('close', function () {
        if (cs.uid && cs.gid) return chown(finalize);

        finalize();
      });

      from.pipe(to);
    });

    function chown (callback) { chownr(root, cs.uid, cs.gid, callback); }

    function finalize(error) {
      if (error) return callback(error);

      writeFile(manifest, JSON.stringify(metadata), "utf8", function (error) {
        callback(error, metadata);
      });
    }
  });
}
