var assert = require("assert");
var createHash = require("crypto").createHash;
var resolve = require("path").resolve;

var lockFile = require("lockfile");

module.exports = Locker;

function Locker(location, options) {
  assert(typeof location === "string", "must include lockfile directory");
  this.location = location;

  if (!options) options = {};
  this.log          = options.log          || require("npmlog");
  this.staleTimeout = options.staleTimeout || 60000;
  this.retries      = options.retries      ||    10;
  this.waitTimeout  = options.waitTimeout  ||  1000;

  this._locks       = {};
}

Locker.prototype.lock = function lock(u, cb) {
  var locker = this;

  // the cache dir needs to exist already for this.
  var opts = {
    stale   : this.staleTimeout,
    retries : this.retries,
    wait    : this.waitTimeout
  };

  var lf = this._getFilename(u);
  this.log.verbose("lock", u, lf);
  lockFile.lock(lf, opts, function(er) {
    if (!er) locker._locks[lf] = true;
    cb(er);
  });
};

Locker.prototype.unlock = function unlock(u, cb) {
  var lf = this._getFilename(u);
  var locks = this._locks;
  var locked = locks[lf];

  if (locked === false) {
    return process.nextTick(cb);
  }
  else if (locked === true) {
    locks[lf] = false;
    lockFile.unlock(this._getFilename(u), cb);
  }
  else {
    throw new Error("Attempt to unlock "+u+", which hasn't been locked");
  }
};

Locker.prototype._getFilename = function _getFilename(u) {
  var c = u.replace(/[^a-zA-Z0-9]+/g, "-")
           .replace(/^-+|-+$/g, "")
           .substr(-32);
  var h = createHash("sha1")
            .update(u)
            .digest("hex")
            .substr(0, 8);
  this.log.silly("lockFile", h + "-" + c, u);
  return resolve(this.location, h + "-" + c + ".lock");
};
