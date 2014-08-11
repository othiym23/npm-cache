var assert = require("assert");
var path = require("path");
var zlib = require("zlib");
var createReadStream = require("fs").createReadStream;
var writeFile = require("fs").writeFile;

var uidNumber = require("uid-number");
var readJson = require("read-package-json");
var fstream = require("fstream");
var tar = require("tar");

var myUid = process.getuid && process.getuid();
var myGid = process.getgid && process.getgid();

module.exports = _untar;

function _untar(tarball, destination, uid, gid, callback) {
  assert(tarball, "must have path to tarball to be unpacked");
  assert(destination, "must have path to write to");
  assert(typeof callback === "function", "must have callback");

  var cache = this;

  uidNumber(uid, gid, function (error, uid, gid) {
    if (error) return callback(error);

    var tarballLock, destinationLock;

    lock(destination, function (er) {
      if (er) return finish(er);

      destinationLock = true;
      next();
    });

    lock(tarball, function (er) {
      if (er) return finish(er);

      tarballLock = true;
      next();
    });

    function next() {
      if (!tarballLock || !destinationLock) return;

      rmGunz();
    }

    function rmGunz () {
      cache._purge(destination, function (error) {
        if (error) return finish(error);
        gtp();
      });
    }

    function gtp () {
      // gzip {tarball} --decompress --stdout \
      //   | tar -mvxpf - --strip-components=1 -C {unpackTarget}
      gunzTarPerm(
        tarball, destination,
        cache.directoryMode, cache.fileMode,
        uid, gid,
        function (error, folder) {
          if (error) return finish(error);

          readJson(path.resolve(folder, "package.json"), finish);
        }
      );
    }

    function finish(error) {
      if (destinationLock) {
        unlock(destination, function () {
          destinationLock = false;
          finish(error);
        });
      }
      else if (tarballLock) {
        unlock(tarball, function () {
          tarballLock = false;
          finish(error);
        });
      }
      else {
        callback(error);
      }
    }
  });

  function lock(filename, callback) {
    return cache.locker.lock("tar://" + filename, callback);
  }

  function unlock(filename, callback) {
    return cache.locker.unlock("tar://" + filename, callback);
  }
}

function gunzTarPerm (tarball, target, dMode, fMode, uid, gid, cb_) {
  if (!dMode) dMode = this.execMode;
  if (!fMode) fMode = this.fileMode;
  this.log.silly("gunzTarPerm", "modes", [dMode.toString(8), fMode.toString(8)]);

  var cache = this;

  var cbCalled = false;
  function cb (er) {
    if (cbCalled) return;

    cbCalled = true;
    cb_(er, target);
  }

  var fst = createReadStream(tarball);

  // figure out who we're supposed to be, if we're not pretending
  // to be a specific user.
  if (this.useUnsafePermissions && process.platform !== "win32") {
    uid = myUid;
    gid = myGid;
  }

  function extractEntry (entry) {
    cache.log.silly("gunzTarPerm", "extractEntry", entry.path);
    // never create things that are user-unreadable,
    // or dirs that are user-un-listable. Only leads to headaches.
    var originalMode = entry.mode = entry.mode || entry.props.mode;
    entry.mode = entry.mode | (entry.type === "Directory" ? dMode : fMode);
    entry.mode = entry.mode & (~cache.modes.umask);
    entry.props.mode = entry.mode;
    if (originalMode !== entry.mode) {
      cache.log.silly("gunzTarPerm", "modified mode", [entry.path, originalMode, entry.mode]);
    }

    // if there's a specific owner uid/gid that we want, then set that
    if (process.platform !== "win32" &&
        typeof uid === "number" &&
        typeof gid === "number") {
      entry.props.uid = entry.uid = uid;
      entry.props.gid = entry.gid = gid;
    }
  }

  var extractOpts = { type: "Directory", path: target, strip: 1 };

  if (process.platform !== "win32" &&
      typeof uid === "number" &&
      typeof gid === "number") {
    extractOpts.uid = uid;
    extractOpts.gid = gid;
  }

  extractOpts.filter = function () {
    // symbolic links are not allowed in packages.
    if (this.type.match(/^.*Link$/)) {
      cache.log.warn(
        "excluding symbolic link",
        this.path.substr(target.length + 1) + " -> " + this.linkpath
      );
      return false;
    }
    return true;
  };


  fst.on("error", function (er) {
    if (er) cache.log.error("tar.unpack", "error reading "+tarball);

    cb(er);
  });

  fst.on("data", function OD (c) {
    // detect what it is.
    // Then, depending on that, we'll figure out whether it's
    // a single-file module, gzipped tarball, or naked tarball.
    // gzipped files all start with 1f8b08
    if (c[0] === 0x1F &&
        c[1] === 0x8B &&
        c[2] === 0x08) {
      fst
        .pipe(zlib.Unzip())
        .on("error", function (er) {
          if (er) cache.log.error("tar.unpack", "unzip error "+tarball);

          cb(er);
        })
        .pipe(tar.Extract(extractOpts))
        .on("entry", extractEntry)
        .on("error", function (er) {
          if (er) cache.log.error("tar.unpack", "untar error "+tarball);

          cb(er);
        })
        .on("close", cb);
    } else if (c.toString().match(/^package\//)) {
      // naked tar
      fst
        .pipe(tar.Extract(extractOpts))
        .on("entry", extractEntry)
        .on("error", function (er) {
          if (er) cache.log.error("tar.unpack", "untar error "+tarball);

          cb(er);
        })
        .on("close", cb);
    }
    else {
      // naked js file
      var jsOpts = { path: path.resolve(target, "index.js") };

      if (process.platform !== "win32" &&
          typeof uid === "number" &&
          typeof gid === "number") {
        jsOpts.uid = uid;
        jsOpts.gid = gid;
      }

      fst.pipe(fstream.Writer(jsOpts))
         .on("error", function (er) {
           if (er) cache.log.error("tar.unpack", "copy error "+tarball);

           cb(er);
         })
         .on("close", function () {
           var j = path.resolve(target, "package.json");
           readJson(j, function (er, d) {
             if (er) {
               cache.log.error("not a package", tarball);

               return cb(er);
             }

             writeFile(j, JSON.stringify(d) + "\n", cb);
           });
         });
    }

    // now un-hook, and re-emit the chunk
    fst.removeListener("data", OD);
    fst.emit("data", c);
  });
}
