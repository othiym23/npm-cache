var assert = require('assert');

module.exports = add;

function add(metadata, callback) {
  if (!metadata) metadata = {};

  assert(
    metadata.stream || metadata.tarball || metadata.directory,
    "add must be called with a stream, tarball, or package directory"
  );
  assert(typeof callback === 'function', "add must be called with a callback");

  if (metadata.stream) {
    this._addStream(metadata.stream, metadata, callback);
  }
  else if (metadata.tarball) {
    var tarball = metadata.tarball;
    delete metadata.tarball;

    this._addTarball(tarball, metadata, callback);
  }
  else if (metadata.directory) {
    this._addDirectory(metadata.directory, metadata, callback);
  }
}
