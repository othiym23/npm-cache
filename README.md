# npm-cache

The code that npm uses to talk to its cache. It handles adding, validating, and
removing cached modules, as well as enumerating the cache's contents.

## Usage

```javascript
var Cache = require('npm-cache');
var cache = new Cache(config.get('cache'));

var metadata = {
  name    : 'npm-cache',
  version : '0.0.1',
  tarball : './npm-cache-0.0.1.tgz'
};
cache.add(metadata, function (error) {
  // error is any errors that resulted from the addition
  if (error) console.error(error.stack);
});
```
# cache.initialize(callback)

* `callback` {Function}
  * `error` {Error | null}

Initialize the cache, only creating the cache if it does not exist.

# cache.ls(pieces, depth, callback)

* `pieces` {Array} package specifier (e.g. `["npm-cache", "0.0.1"]`).
* `depth` {Number} Depth to which the listing should enumerate.
* `callback` {Function}
  * `error` {Error | null}
  * `files` {Array} List of paths from the cache.

List the contents of a path in the registry. If no pieces are passed in,
enumerate the complete contents of the cache.
