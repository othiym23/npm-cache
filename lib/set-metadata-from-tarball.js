var assert = require("assert");

module.exports = _setMetadataFromTarball;

function _setMetadataFromTarball(tarball, metadata, callback) {
  assert(tarball, "must have path to tarball to be read");
  assert(metadata._shasum, "must have shasum by now");
  assert(typeof callback === "function", "must have callback");

  var cache = this;

  this._getStat(function (error, st) {
    if (error) return callback(error);

    var target = tarball + "-unpack";
    cache._untar(tarball, target, st.uid, st.gid, function (error) {
      if (error) return callback(error);

    });
  });
}
