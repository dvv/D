'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

var Url = require('url'),
		Fs = require('fs'),
		Path = require('path');

//
// ReST resource routing
//
module.exports = function setup(root, options) {

	// setup
	options = options || {};

	// normalize mount points to always end in /
	if (root[root.length - 1] !== '/') { root += '/'; }

	// handler
	return function handler(req, res, next) {
		// parse out pathname if it's not there already (other middleware may have done it already)
		//if (!req.hasOwnProperty('uri')) { req.uri = Url.parse(req.url); }

		// mount relative to the given root
		var path = req.uri.pathname;
		if (path.substr(0, root.length) !== root) { return next(); }

		// get the requested controller and method
		var parts = path.substr(root.length).split('/').map(function(p){return decodeURIComponent(p)});
		if (parts[parts.length - 1] === '') { parts.pop(); } // N.B. trailing slash is noop

		// find the resource
		var controllers = req.context;
		var controller = parts[0];
		if (!controllers.hasOwnProperty(controller)) { return next(); }
		controller = controllers[controller];

		Next({},
			//
			// get controllers
			//
			//function(err, result, step){
			//},
			//
			// determine the controller method and parameters
			//
			function(err, result, step){
				//if (err) return step(err);
				var method = req.method;
				var id = parts[1];
				var m, p;
				//
				// query resource
				//
				if (method === 'GET') {
					m = 'get';
					// get by ID
					// FIXME: make _new configurable
					if (id && id !== '_new') {
						p = [id];
					// query
					} else {
						m = 'query';
						// bulk get via POST X-HTTP-Method-Override: GET
						if (Array.isArray(req.body)) {
							p = [req.body];
						// query by RQL
						} else {
							p = [req.uri.search];
						}
					}
				//
				// create new / update resource
				//
				} else if (method === 'PUT') {
					m = 'update';
					if (id) {
						// add new
						if (id === '_new') {
							m = 'add';
							p = [req.body];
						// update by ID
						} else {
							p = [id, req.body];
						}
					} else {
						// bulk update via POST X-HTTP-Method-Override: PUT
						if (Array.isArray(req.body) && Array.isArray(req.body[0])) {
							p = [req.body[0], req.body[1]];
						// update by RQL
						} else {
							p = [req.uri.search, req.body];
						}
					}
				//
				// remove resource
				//
				} else if (method === 'DELETE') {
					m = 'remove';
					if (id && id !== '_new') {
						p = [id];
					} else {
						// bulk remove via POST X-HTTP-Method-Override: DELETE
						if (Array.isArray(req.body)) {
							p = [req.body];
						// remove by RQL
						} else if (req.uri.search) {
							p = [req.uri.search];
						// won't remove w/o conditions
						} else {
							return step(options.jsonrpc ? 'notsupported' : 405);
						}
					}
				//
				// arbitrary RPC to resource
				//
				} else if (method === 'POST') {
					// ??? add ???
				//
				// get capabilities of resource
				//
				} else if (method === 'OPTIONS') {
					// ???
				//
				// unsupported verb
				//
				} else {
				}
				// bail out if method is unsupported
				if (!controller.hasOwnProperty(m)) { return step(options.jsonrpc ? 'notsupported' : 405); }
				//
				// call the handler. signature is fn(controllers, p..., step)
				//
				var args = p;
				args.unshift(controllers);
				args.push(step);
				controller[m].apply(null, args);
			},
			//
			// wrap the response to JSONRPC format if specified
			//
			function(err, result, step){
				var response;
				if (options.jsonrpc) {
					response = {
						//jsonrpc: options.jsonrpc
					};
					if (err) {
						//process.log(err.stack);
						response.error = err.message || err;
					} else if (result === void 0) {
						response.result = true;
					} else {
						response.result = result;
					}
					res.send(response);
				// plain response
				} else {
					if (err) {
						res.send(err.message || err, null, 406);
					} else {
						res.send(result);
					}
				}
			}
		);

	};

};
