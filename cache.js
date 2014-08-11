module.exports = Cache;

function Cache(location, options) {
  if (!options) options = {};

  this.location = location;
  this.depth = options.depth === undefined ? Infinity : options.depth;
}

Cache.prototype.initialize = require("./lib/initialize.js");
Cache.prototype.ls = require("./lib/ls.js");
