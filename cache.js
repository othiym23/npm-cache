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
  assert(Array.isArray(pieces), "path components must be an array");
  if (depth === undefined || depth === null) depth = this.depth;
  assert(callback, "ls requires a callback");

  var root = this.location;
  var target = pieces.join("/").split("@").join("/");
  if (target.substr(-1) === "/") target = target.substr(0, target.length - 1);

  var prefix = root;
  if (0 === prefix.indexOf(process.env.HOME)) {
    prefix = '~' + prefix.substr(process.env.HOME.length);
  }

  var pattern = util.format("%s/{%s,%s/**/*}", root, target, target);
  var options = {mark : true, dot : true, maxDepth : depth};

  function canonicalize(f) {
    var slice = f === target ? path.dirname(target) : target;
    var relative = f.substr(root.length + 1)
                    .substr(slice.length)
                    .replace(/^\//, "");

    return path.join(prefix, target, relative);
  }

  glob(pattern, options, function (error, files) {
    if (error) return callback(error);
    if (files.length < 1) return callback(new Error("cache not found"));

    return callback(null, files.map(canonicalize));
  });
};
