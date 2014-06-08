var path = require('path');
var stat = require('fs').stat;

var test    = require('tap').test;
var mkdtemp = require('tmp').dir;

var Cache = require('../cache.js');

var TEMP_OPTIONS = {
  unsafeCleanup : true,
  mode          : '0700'
};

test("cache initialize nonexistent directory", function (t) {
  mkdtemp(TEMP_OPTIONS, function (error, tmpdir) {
    if (error) {
      t.fail("couldn't create test directory");
      return t.end();
    }

    var location = path.join(tmpdir, 'npm-cache');
    var cache = new Cache(location);
    cache.initialize(function (error) {
      t.notOk(error, "got no error on initialization");

      stat(location, function (error) {
        t.notOk(error, "was able to read directory without error");

        t.end();
      });
    });
  });
});

test("cache initialize already initialized", function (t) {
  mkdtemp(TEMP_OPTIONS, function (error, tmpdir) {
    if (error) {
      t.fail("couldn't create test directory");
      return t.end();
    }

    var location = path.join(tmpdir, 'npm-cache');
    var cache = new Cache(location);
    cache.initialize(function () {
      cache.initialize(function (error) {
        t.notOk(error, "got no error on initialization");

        stat(location, function (error) {
          t.notOk(error, "was able to read directory without error");

          t.end();
        });
      });
    });
  });
});

test("cache initialize unreadable root", function (t) {
  var options = {
    unsafeCleanup : true,
    mode          : '0000'
  };

  mkdtemp(options, function (error, tmpdir) {
    if (error) {
      t.fail("couldn't create test directory");
      return t.end();
    }

    var location = path.join(tmpdir, 'NOPERM');
    var cache = new Cache(location);
    cache.initialize(function (error) {
      t.ok(error, "expected failure");
      t.end();
    });
  });
});

test("cache initialize unwritable root", function (t) {
  var options = {
    unsafeCleanup : true,
    mode          : '0100'
  };

  mkdtemp(options, function (error, tmpdir) {
    if (error) {
      t.fail("couldn't create test directory");
      return t.end();
    }

    var location = path.join(tmpdir, 'NOPERM');
    var cache = new Cache(location);
    cache.initialize(function (error) {
      t.ok(error, "expected failure");
      t.end();
    });
  });
});
