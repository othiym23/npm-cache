var test = require('tap').test;
var path = require('path');

var Cache = require('../cache.js');

var resolved = path.relative(
  process.cwd(),
  path.resolve(__dirname, 'fixtures/simple-cache')
);

test("cache ls with incorrect pieces argument type", function (t) {
  var cache = new Cache(resolved);

  t.throws(function () {
    cache.ls("ham", null, function () {});
  }, "threw up on wrong argument type");

  t.end();
});

test("cache ls with missing callback", function (t) {
  var cache = new Cache(resolved);

  t.throws(function () {
    cache.ls([], Infinity);
  }, "threw up on missing callback");

  t.end();
});

test("cache ls <all>", function (t) {
  var cache = new Cache(resolved);

  cache.ls(null, null, function (error, files) {
    t.notOk(error, "no error was raised");

    t.ok(files, "got listing");

    t.equal(files.length, 6, "got the six expected entries");
    t.deepEqual(
      files,
      [
        resolved,
        resolved + '/yo/',
        resolved + '/yo/1.1.2/',
        resolved + '/yo/1.1.2/package/',
        resolved + '/yo/1.1.2/package.tgz',
        resolved + '/yo/1.1.2/package/package.json'
      ],
      "got expected file listing"
    );

    t.end();
  });
});

test("cache ls yo", function (t) {
  var cache = new Cache(resolved);

  cache.ls(['yo'], null, function (error, files) {
    t.notOk(error, "no error was raised");

    t.ok(files, "got listing");

    t.equal(files.length, 5, "got the five expected entries");
    t.deepEqual(
      files,
      [
        resolved + '/yo',
        resolved + '/yo/1.1.2/',
        resolved + '/yo/1.1.2/package/',
        resolved + '/yo/1.1.2/package.tgz',
        resolved + '/yo/1.1.2/package/package.json'
      ],
      "got expected file listing"
    );

    t.end();
  });
});

test("cache ls yo 1.1.2", function (t) {
  var cache = new Cache(resolved);

  cache.ls(['yo', '1.1.2'], null, function (error, files) {
    t.notOk(error, "no error was raised");

    t.ok(files, "got listing");

    t.equal(files.length, 4, "got the four expected entries");
    t.deepEqual(
      files,
      [
        resolved + '/yo/1.1.2',
        resolved + '/yo/1.1.2/package/',
        resolved + '/yo/1.1.2/package.tgz',
        resolved + '/yo/1.1.2/package/package.json'
      ],
      "got expected file listing"
    );

    t.end();
  });
});

test("cache ls yo@1.1.2", function (t) {
  var cache = new Cache(resolved);

  cache.ls(['yo@1.1.2'], null, function (error, files) {
    t.notOk(error, "no error was raised");

    t.ok(files, "got listing");

    t.equal(files.length, 4, "got the four expected entries");
    t.deepEqual(
      files,
      [
        resolved + '/yo/1.1.2',
        resolved + '/yo/1.1.2/package/',
        resolved + '/yo/1.1.2/package.tgz',
        resolved + '/yo/1.1.2/package/package.json'
      ],
      "got expected file listing"
    );

    t.end();
  });
});

test("cache ls yo --depth=0", function (t) {
  var cache = new Cache(resolved);

  cache.ls(['yo'], 0, function (error, files) {
    t.notOk(error, "no error was raised");

    t.ok(files, "got listing");

    t.equal(files.length, 5, "got the five expected entries");
    t.deepEqual(
      files,
      [
        resolved + '/yo',
        resolved + '/yo/1.1.2/',
        resolved + '/yo/1.1.2/package/',
        resolved + '/yo/1.1.2/package.tgz',
        resolved + '/yo/1.1.2/package/package.json'
      ],
      "got expected file listing"
    );

    t.end();
  });
});

test("cache ls yo --depth=1", function (t) {
  var cache = new Cache(resolved);

  cache.ls(['yo'], 1, function (error, files) {
    t.notOk(error, "no error was raised");

    t.ok(files, "got listing");

    t.equal(files.length, 1, "got the expected entry");
    t.deepEqual(
      files,
      [
        resolved + '/yo'
      ],
      "got expected file listing"
    );

    t.end();
  });
});

test("cache ls yo --depth=2", function (t) {
  var cache = new Cache(resolved);

  cache.ls(['yo'], 2, function (error, files) {
    t.notOk(error, "no error was raised");

    t.ok(files, "got listing");

    t.equal(files.length, 4, "got the four expected entries");
    t.deepEqual(
      files,
      [
        resolved + '/yo',
        resolved + '/yo/1.1.2/',
        resolved + '/yo/1.1.2/package/',
        resolved + '/yo/1.1.2/package.tgz'
      ],
      "got expected file listing"
    );

    t.end();
  });
});

test("cache ls yo --depth=3", function (t) {
  var cache = new Cache(resolved);

  cache.ls(['yo'], 3, function (error, files) {
    t.notOk(error, "no error was raised");

    t.ok(files, "got listing");

    t.equal(files.length, 5, "got the five expected entries");
    t.deepEqual(
      files,
      [
        resolved + '/yo',
        resolved + '/yo/1.1.2/',
        resolved + '/yo/1.1.2/package/',
        resolved + '/yo/1.1.2/package.tgz',
        resolved + '/yo/1.1.2/package/package.json'
      ],
      "got expected file listing"
    );

    t.end();
  });
});

test("cache ls with full path", function (t) {
  var full = path.resolve(__dirname, 'fixtures/simple-cache');
  var cache = new Cache(full);

  cache.ls([], null, function (error, files) {
    t.notOk(error, "no error was raised");

    var prefixed = full.replace(process.env.HOME, '~');
    t.equal(files[0], prefixed, "path mangled appropriately");

    t.end();
  });
});
