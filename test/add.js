var path = require("path");

var test    = require("tap").test;
var mkdtemp = require("tmp").dir;

var Cache = require("../cache.js");

var TEMP_OPTIONS = {
  unsafeCleanup : true,
  mode          : "0700"
};

test("cache add with no tarball, directory, or stream", function (t) {
  mkdtemp(TEMP_OPTIONS, function (error, tmpdir) {
    if (error) {
      t.fail("couldn't create test directory");
      return t.end();
    }

    var location = path.join(tmpdir, ".npm");
    var cache = new Cache(location);

    var threw;
    try {
      cache.add({}, function () {});
    }
    catch (error) {
      threw = error;
    }

    t.ok(threw, "got error");
    t.equal(
      threw.message,
      "add must be called with a stream, tarball, or package directory",
      "got expected error message"
    );

    t.end();
  });
});

test("cache add <tarball>", function (t) {
  mkdtemp(TEMP_OPTIONS, function (error, tmpdir) {
    if (error) {
      t.fail("couldn't create test directory");
      return t.end();
    }

    var location = path.join(tmpdir, ".npm");
    var cache = new Cache(location);

    var tarball = path.resolve(__dirname, "fixtures/simple-cache/yo/1.1.2/package.tgz");
    var metadata = {tarball : tarball};

    cache.add(metadata, function (error, data) {
      t.notOk(error, "no error adding");
      t.ok(data, "got back package data");

      t.notOk(data.tarball, "tarball parameter has been picked off metadata");
      t.equal(data._resolved, tarball, "got resolved original path");
      t.equal(data._shasum, "a0d4da72e83fa0e0dbfe1d0ba258881b240ab854", "got shasum");
      t.equal(data.name, "yo", "name is yo");
      t.equal(data.version, "1.1.2", "version is 1.1.2");

      var manifest;
      try {
        manifest = require(path.join(location, "yo", "1.1.2", "package", "package.json"));
      }
      catch (e) {
        t.fail("unable to read added package's manifest");
        return t.end();
      }

      t.equal(manifest._resolved, data._resolved, "resolved matches in data & manifest");
      t.equal(manifest._shasum, data._shasum, "SHA matches in data & manifest");
      t.equal(manifest.name, data.name, "name matches in data and manifest");
      t.equal(manifest.version, data.version, "version matches in data and manifest");

      t.end();
    });
  });
});

test("cache add <tarball> with prepopulated metadata", function (t) {
  mkdtemp(TEMP_OPTIONS, function (error, tmpdir) {
    if (error) {
      t.fail("couldn't create test directory");
      return t.end();
    }

    var location = path.join(tmpdir, ".npm");
    var cache = new Cache(location);

    var tarball = path.resolve(__dirname, "fixtures/simple-cache/yo/1.1.2/package.tgz");
    var metadata = {
      tarball : tarball,
      name    : "yo",
      version : "1.1.2",
      _shasum : "a0d4da72e83fa0e0dbfe1d0ba258881b240ab854"
    };

    cache.add(metadata, function (error, data) {
      t.notOk(error, "no error adding");
      t.ok(data, "got back package data");

      t.notOk(data.tarball, "tarball parameter has been picked off metadata");
      t.equal(data._resolved, tarball, "got resolved original path");
      t.equal(data._shasum, "a0d4da72e83fa0e0dbfe1d0ba258881b240ab854", "got shasum");
      t.equal(data.name, "yo", "name is yo");
      t.equal(data.version, "1.1.2", "version is 1.1.2");

      var manifest;
      try {
        manifest = require(path.join(location, "yo", "1.1.2", "package", "package.json"));
      }
      catch (e) {
        t.fail("unable to read added package's manifest");
        return t.end();
      }

      t.equal(manifest._resolved, data._resolved, "resolved matches in data & manifest");
      t.equal(manifest._shasum, data._shasum, "SHA matches in data & manifest");
      t.equal(manifest.name, data.name, "name matches in data and manifest");
      t.equal(manifest.version, data.version, "version matches in data and manifest");

      t.end();
    });
  });
});
