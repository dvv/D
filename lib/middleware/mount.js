'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

//
// connect an URI and optionally HTTP verb to a stack handler
//
// mount('GET', '/info', function(req, res, next){})
// mount('/info', {get: function(req, res, next){}}, post: ...)
//
module.exports = function setup(verb, mount, handler) {

	//
	// 3 parameters -> expect exact match
	//
	if (handler) {

		return function(req, res, next) {
			if (req.method === verb && req.uri.pathname === mount) {
				return handler(req, res, next);
			} else {
				return next();
			}
		};

	//
	// 2 or less parameters -> method chooses the key of handlers hash
	//
	} else {

		handler = mount;
		mount = verb;
		return function(req, res, next) {
			var fn;
			if (req.uri.pathname === mount && (fn = handler[req.method.toLowerCase()])) {
				return fn(req, res, next);
			} else {
				return next();
			}
		};

	}

};
