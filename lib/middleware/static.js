'use static';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

//
// serve static content from @root
//
var Fs, Path, Url, getMime;
Path = require('path');
Url = require('url');
Fs = require('fs');
getMime = require('simple-mime')('application/octet-stream');
module.exports = function setup(mount, root, index, options) {
  var ENOENT, handle, mlength;
  if (options == null) options = {};
  ENOENT = require('constants').ENOENT;
  mlength = mount.length;

	// N.B. we aggressively cache since we rely on watch/reload
	var statCache = {};

  return function(req, res, next) {
		if (req.method !== 'GET') return next();
    var onStat, path;
    path = unescape(req.uri.pathname).replace(/\.\.+/g, '.');
    if (!path || path.substr(0, mlength) !== mount) {
      return next();
    }
    path = Path.join(root, path.substr(mlength));
    if (path[path.length - 1] === '/') {
      path = path.substr(0, path.length - 1);
    }
    onStat = function(err, stat) {
      var code, end, headers, p, parts, start, stream;
      if (err) {
        if (err.errno === ENOENT) {
          return next();
        }
        return next(err);
      }
      if (index && stat.isDirectory()) {
        path = Path.join(path, index);
        return Fs.stat(path, onStat);
      }
      if (!stat.isFile()) {
        return next(err);
      }
      headers = {
        'Date': (new Date()).toUTCString(),
        'Last-Modified': stat.mtime.toUTCString()
      };
      if (headers['Last-Modified'] === req.headers['if-modified-since']) {
        return res.send(304, headers);
      }
      start = 0;
      end = stat.size - 1;
      code = 200;
      if (req.headers.range) {
        p = req.headers.range.indexOf('=');
        parts = req.headers.range.substr(p + 1).split('-');
        if (parts[0].length) {
          start = +parts[0];
          if (parts[1].length) {
            end = +parts[1];
          }
        } else {
          if (parts[1].length) {
            start = end + 1 - +parts[1];
          }
        }
        if (end < start || start < 0 || end >= stat.size) {
          return res.send(416, headers);
        }
        code = 206;
        headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stat.size;
      }
      headers['Content-Length'] = end - start + 1;
      headers['Content-Type'] = getMime(path);
      if (stat.size === 0) {
        return res.send(code, headers);
      }
      // TODO: cache contents, sliced Buffer
      stream = Fs.createReadStream(path, {
        start: start,
        end: end
      });
      stream.once('data', function(chunk) {
        res.writeHead(code, headers);
      });
      stream.pipe(res);
      stream.on('error', next);
    };
    if (statCache.hasOwnProperty(path)) {
			onStat(null, statCache[path]);
		} else {
			Fs.stat(path, function(err, stat){
				//process.log('STAT!', path, stat);
				if (!err) statCache[path] = stat;
				onStat(err, stat);
			});
		}
  };
};
