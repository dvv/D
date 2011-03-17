//
// thanks creationix/creationix/controller
//

var Url = require('url'),
		Fs = require('fs'),
		Path = require('path');

// ReST resource routing
module.exports = function setup(root, controllerFolder) {

	// Normalize mount points to always end in /
	if (root[root.length - 1] !== '/') { root += '/'; }
	// Normalize controller folder so require understands it
	controllerFolder = Fs.realpathSync(controllerFolder);

	// Load the controllers at startup
	var controllers = {};
	Fs.readdirSync(controllerFolder).forEach(function (name) {
		var ext = Path.extname(name);
		if (ext === '.js') {
			process.log('RESOURCE ' + name);
			controllers[Path.basename(name, '.js')] = require(Path.join(controllerFolder, name));
		}
	});

	// Generate a request handling function	
	return function (req, res, next) {
		// parse out pathname if it's not there already (other middleware may have done it already)
		if (!req.hasOwnProperty('uri')) { req.uri = Url.parse(req.url); }

		// Mount relative to the given root
		var path = req.uri.pathname;
		if (path.substr(0, root.length) !== root) { return next(); }

		// Get the requested controller and method
		var parts = path.substr(root.length).split('/').map(function(p){return decodeURIComponent(p)});
		if (parts[parts.length - 1] === '') { parts.pop(); } // Trailing slash is noop

		// Find the resource
		var controller = parts.shift();
		if (!controllers.hasOwnProperty(controller)) { return next(); }
		controller = controllers[controller];

		// Find the method
		var method = req.method.toLowerCase();
		if (!controller.hasOwnProperty(method)) { return res.send(405); }

		// Call it!
		var args = [req, res, next];
		args.push.apply(args, parts);
		controller[method].apply(controller, args);
		return;
		controller[method].call(null, req.context, function(err, result){
			if (err) {
				res.send(err);
			} else if (result !== undefined) {
				res.send(result);
			} else {
				next();
			}
		}, parts, req.uri.search);
	};

};
