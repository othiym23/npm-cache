var resolve = require("path").resolve;
var dirname = require("path").dirname;
var lstat = require("graceful-fs").lstat;
var readlink = require("graceful-fs").readlink;

var isInside = require("path-is-inside");
var rimraf = require("rimraf");
var vacuum = require("fs-vacuum");
var some = require("async-some");

var resolvedPaths = {};

module.exports = purge;

function purge(path, gently, cb) {
  if (!cb) {
    cb = gently;
    gently = null;
  }

  var cache = this;
  var dirs = this.dirs;

  // never rm the root, prefix, or bin dirs.
  // just a safety precaution.
  var prefixes = [
    dirs.dir,       dirs.root,       dirs.bin,       dirs.prefix,
    dirs.globalDir, dirs.globalRoot, dirs.globalBin, dirs.globalPrefix
  ];

  var resolved = resolve(path);
  if (prefixes.indexOf(resolved) !== -1) {
    this.log.verbose("gentlyRm", resolved, "is part of npm and can't be removed");
    return cb(new Error("May not delete: "+resolved));
  }

  var options = {log : this.log.silly.bind(this.log, "gentlyRm")};
  if (this.force || !gently) options.purge = true;

  if (!gently) {
    this.log.verbose("gentlyRm", "vacuuming", resolved);
    return vacuum(resolved, options, cb);
  }

  var parent = resolve(gently);
  this.log.verbose("gentlyRm", "verifying that", parent, "is managed by npm");
  some(prefixes, isManaged(parent), function (er, matched) {
    if (er) return cb(er);

    if (!matched) {
      cache.log.verbose("gentlyRm", parent, "is not managed by npm");
      return clobberFail(resolved, parent, cb);
    }

    cache.log.silly("gentlyRm", parent, "is managed by npm");

    if (isInside(resolved, parent)) {
      cache.log.silly("gentlyRm", resolved, "is under", parent);
      cache.log.verbose("gentlyRm", "vacuuming", resolved, "up to", parent);
      options.base = parent;
      return vacuum(resolved, options, cb);
    }

    cache.log.silly("gentlyRm", resolved, "is not under", parent);
    cache.log.silly("gentlyRm", "checking to see if", resolved, "is a link");
    lstat(resolved, function (er, stat) {
      if (er) {
        if (er.code === "ENOENT") return cb(null);
        return cb(er);
      }

      if (!stat.isSymbolicLink()) {
        cache.log.verbose("gentlyRm", resolved, "is outside", parent, "and not a link");
        return clobberFail(resolved, parent, cb);
      }

      cache.log.silly("gentlyRm", resolved, "is a link");
      readlink(resolved, function (er, link) {
        if (er) {
          if (er.code === "ENOENT") return cb(null);
          return cb(er);
        }

        var source = resolve(dirname(resolved), link);
        if (isInside(source, parent)) {
          cache.log.silly("gentlyRm", source, "inside", parent);
          cache.log.verbose("gentlyRm", "vacuuming", resolved);
          return vacuum(resolved, options, cb);
        }

        cache.log.silly("gentlyRm", "checking to see if", source, "is managed by npm");
        some(prefixes, isManaged(source), function (er, matched) {
          if (er) return cb(er);

          if (matched) {
            cache.log.silly("gentlyRm", source, "is under", matched);
            cache.log.verbose("gentlyRm", "removing", resolved);
            rimraf(resolved, cb);
          }

          cache.log.verbose("gentlyRm", source, "is not managed by npm");
          return clobberFail(path, parent, cb);
        });
      });
    });
  });

  function isManaged(target) {
    return predicate;

    function predicate(path, cb) {
      if (!path) {
        cache.log.verbose("isManaged", "no path");
        return cb(null, false);
      }

      path = resolve(path);

      // if the path has already been memoized, return immediately
      var normalized = resolvedPaths[path];
      if (normalized) {
        var inside = isInside(target, normalized);
        cache.log.silly("isManaged", target, inside ? "is" : "is not", "inside", normalized);

        return cb(null, inside && path);
      }

      // otherwise, check the path
      lstat(path, function (er, stat) {
        if (er) {
          if (er.code === "ENOENT") return cb(null, false);

          return cb(er);
        }

        // if it's not a link, cache & test the path itself
        if (!stat.isSymbolicLink()) return cacheAndTest(path, path, target, cb);

        // otherwise, cache & test the link's source
        readlink(path, function (er, source) {
          if (er) {
            if (er.code === "ENOENT") return cb(null, false);

            return cb(er);
          }

          cacheAndTest(resolve(path, source), path, target, cb);
        });
      });
    }

    function cacheAndTest(resolved, source, target, cb) {
      resolvedPaths[source] = resolved;
      var inside = isInside(target, resolved);
      cache.log.silly("cacheAndTest", target, inside ? "is" : "is not", "inside", resolved);
      cb(null, inside && source);
    }
  }
}

function clobberFail(p, g, cb) {
  var er = new Error("Refusing to delete: "+p+" not in "+g);
  er.code = "EEXIST";
  er.path = p;
  return cb(er);
}
