var path   = require('path');
var util   = require('util');
var assert = require('assert');

var glob = require('glob');

module.exports = Cache;

function Cache(location, options) {
  if (!options) options = {};

  this.location = location;
  this.depth = options.depth === undefined ? Infinity : options.depth;
}

Cache.prototype.ls = function ls(pieces, depth, callback) {
  if (!pieces) pieces = [];
  if (depth === undefined || depth === null) depth = this.depth;

  assert(Array.isArray(pieces), "path components must be an array");
  assert(callback, "ls requires a callback");

  var cache = this;

  var target = pieces.join("/").split("@").join("/");
  if (target.substr(-1) === "/") target = target.slice(0, target.length - 1);

  var prefix = this.location;
  if (0 === prefix.indexOf(process.env.HOME)) {
    prefix = '~' + prefix.slice(process.env.HOME.length);
  }

  var pattern = util.format("%s/{%s,%s/**/*}", this.location, target, target);
  var options = {mark : true, dot : true, maxDepth : depth};

  function canonicalize(filename) {
    var shrinkage = target.length;
    if (filename === target) shrinkage = path.dirname(target).length;

    var relative = filename.slice(cache.location.length + 1)
                           .slice(shrinkage)
                           .replace(/^\//, "");

    return path.join(prefix, target, relative);
  }

  glob(pattern, options, function (error, files) {
    if (error) return callback(error);
    if (files.length < 1) return callback(new Error("cache not found"));

    return callback(null, files.map(canonicalize));
  });
};
