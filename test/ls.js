var test = require('tap').test;
var path = require('path');

var Cache = require('../cache.js');

test("cache ls with incorrect pieces argument type", function (t) {
  var cache = new Cache('./test/fixtures/simple-cache');

  t.throws(function () {
    cache.ls("ham", null, function () {});
  }, "threw up on wrong argument type");

  t.end();
});

test("cache ls with missing callback", function (t) {
  var cache = new Cache('./test/fixtures/simple-cache');

  t.throws(function () {
    cache.ls([], Infinity);
  }, "threw up on missing callback");

  t.end();
});

test("cache ls <all>", function (t) {
  var cache = new Cache('./test/fixtures/simple-cache');

  cache.ls(null, null, function (error, files) {
    t.notOk(error, "no error was raised");

    t.ok(files, "got listing");

    t.equal(files.length, 6, "got the six expected entries");
    t.deepEqual(
      files,
      [
        'test/fixtures/simple-cache',
        'test/fixtures/simple-cache/yo/',
        'test/fixtures/simple-cache/yo/1.1.2/',
        'test/fixtures/simple-cache/yo/1.1.2/package/',
        'test/fixtures/simple-cache/yo/1.1.2/package.tgz',
        'test/fixtures/simple-cache/yo/1.1.2/package/package.json'
      ],
      "got expected file listing"
    );

    t.end();
  });
});

test("cache ls yo", function (t) {
  var cache = new Cache('./test/fixtures/simple-cache');

  cache.ls(['yo'], null, function (error, files) {
    t.notOk(error, "no error was raised");

    t.ok(files, "got listing");

    t.equal(files.length, 5, "got the six expected entries");
    t.deepEqual(
      files,
      [
        'test/fixtures/simple-cache/yo',
        'test/fixtures/simple-cache/yo/1.1.2/',
        'test/fixtures/simple-cache/yo/1.1.2/package/',
        'test/fixtures/simple-cache/yo/1.1.2/package.tgz',
        'test/fixtures/simple-cache/yo/1.1.2/package/package.json'
      ],
      "got expected file listing"
    );

    t.end();
  });
});

test("cache ls yo 1.1.2", function (t) {
  var cache = new Cache('./test/fixtures/simple-cache');

  cache.ls(['yo', '1.1.2'], null, function (error, files) {
    t.notOk(error, "no error was raised");

    t.ok(files, "got listing");

    t.equal(files.length, 4, "got the six expected entries");
    t.deepEqual(
      files,
      [
        'test/fixtures/simple-cache/yo/1.1.2',
        'test/fixtures/simple-cache/yo/1.1.2/package/',
        'test/fixtures/simple-cache/yo/1.1.2/package.tgz',
        'test/fixtures/simple-cache/yo/1.1.2/package/package.json'
      ],
      "got expected file listing"
    );

    t.end();
  });
});

test("cache ls with full path", function (t) {
  var resolved = path.resolve(__dirname, 'fixtures/simple-cache');
  var cache = new Cache(resolved);

  cache.ls([], null, function (error, files) {
    t.notOk(error, "no error was raised");

    var prefixed = resolved.replace(process.env.HOME, '~');
    t.equal(files[0], prefixed, "path mangled appropriately");

    t.end();
  });
});
