var join = require("path").join;

var test    = require("tap").test;
var mkdtemp = require("tmp").dir;

var Cache = require("../cache.js");

var TEMP_OPTIONS = {
  unsafeCleanup : true,
  mode          : "0700"
};

test("cache initialized with no location", function (t) {
  /*eslint no-new:0 */
  t.throws(function () { new Cache(); }, "blew up without cache location");
  t.end();
});

test("cache defaults", function (t) {
  mkdtemp(TEMP_OPTIONS, function (error, tmpdir) {
    if (error) {
      t.fail("couldn't create test directory");
      return t.end();
    }

    var location = join(tmpdir, "npm-cache");
    var cache = new Cache(location);

    t.equal(cache.location, location, "location set correctly");
    t.equal(cache.depth, Infinity, "depth defaults to all the way");
    t.equal(cache.useUnsafePermissions, false, "don't default to unsafe permissions");

    var defaultDirs = {
      dir  : process.cwd(),
      root : "/"
    };
    t.deepEqual(cache.dirs, defaultDirs, "expected default directories");

    var defaultModes = {
      file  : "0666",
      exec  : "0777",
      umask : "0022"
    };
    t.deepEqual(cache.modes, defaultModes, "expected modes");

    t.end();
  });
});
