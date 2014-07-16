var join = require("path").join;

var test    = require("tap").test;
var mkdtemp = require("tmp").dir;

var Locker = require("../lib/locker.js");

var TEMP_OPTIONS = {
  unsafeCleanup : true,
  mode          : "0700"
};

test("cache locker initialized with no location", function (t) {
  /*eslint no-new:0 */
  t.throws(function () { new Locker(); }, "blew up without lock directory");
  t.end();
});

test("cache locker defaults", function (t) {
  mkdtemp(TEMP_OPTIONS, function (error, tmpdir) {
    if (error) {
      t.fail("couldn't create test directory");
      return t.end();
    }

    var location = join(tmpdir, "npm-locks");
    var locker = new Locker(location);

    t.equal(locker.location, location, "location set correctly");
    t.equal(
      locker.staleTimeout,
      60 * 1000,
      "the default stale timeout for locks is 60 seconds"
    );
    t.equal(locker.retries, 10, "locker makes 10 attempts to get the lock by default");
    t.equal(locker.waitTimeout, 1000, "locker waits a second between retries by default");

    t.end();
  });
});
