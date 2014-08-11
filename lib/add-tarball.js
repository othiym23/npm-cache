var assert = require("assert");

var fs    = require("graceful-fs");
var lstat = fs.lstat;
var sha   = require("sha");

module.exports = _addTarball;

function _addTarball(tarball, metadata, callback) {
  if (!metadata) metadata = {};

  assert(tarball, "must pass path to tarball");

  var cache = this;

  lstat(tarball, function doesTarballExist(error) {
    if (error) return callback(error);
    if (!metadata._shasum) return addChecksum(tarball, metadata, callback);

    cache.initialize(function (error) {
      if (error) return callback(error);

      metadata._resolved = tarball;
      if (metadata.name && metadata.version) {
        cache._placeTarball(tarball, metadata, callback);
      }
      else {
        cache._setMetadataFromTarball(tarball, metadata, callback);
      }
    });
  });

  function addChecksum(tarball, metadata, callback) {
    sha.get(tarball, function (error, shasum) {
      if (error) return callback(error);

      metadata._shasum = shasum;
      cache._addTarball(tarball, metadata, callback);
    });
  }
}
