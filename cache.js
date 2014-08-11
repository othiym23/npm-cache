var assert = require("assert");

var Locker = require("./lib/locker.js");

module.exports = Cache;

function Cache(location, options) {
  assert(typeof location === "string", "must pass cache location");
  if (!options) options = {};

  this.log = options.log || require("npmlog");
  this.location = location;
  this.depth = options.depth === undefined ? Infinity : options.depth;

  this.dirs = {};
  this.dirs.dir  = (options.dirs && options.dirs.dir)  || process.cwd();
  this.dirs.root = (options.dirs && options.dirs.root) || "/";

  this.modes = {};
  this.modes.file  = (options.modes && options.modes.file)  || "0666";
  this.modes.exec  = (options.modes && options.modes.exec)  || "0777";
  this.modes.umask = (options.modes && options.modes.umask) || "0022";

  this.useUnsafePermissions = options.useUnsafePermissions || false;

  this.locker = new Locker({
    location     : this.location,
    log          : this.log,
    staleTimeout : options.staleTimeout,
    retries      : options.retries,
    waitTimeout  : options.waitTImeout
  });
}

Cache.prototype = {
  // documented API
  add                     : require("./lib/add.js"),
  initialize              : require("./lib/initialize.js"),
  ls                      : require("./lib/ls.js"),
  // private helper functions
  _addTarball             : require("./lib/add-tarball.js"),
  _placeTarball           : require("./lib/place-tarball.js"),
  _setMetadataFromTarball : require("./lib/set-metadata-from-tarball.js"),
  _getStat                : require("./lib/get-stat.js"),
  _untar                  : require("./lib/untar.js")
};
