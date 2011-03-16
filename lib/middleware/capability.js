'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

//
// cache req.context with capability of current session user
//
// @getCapability function(uid, next){next(null, {meth1: ..., methN: ...});}
//
// use after cookie-sessions
//
module.exports = function setup(getCapability){

	// setup

	// contexts cache
	var cache = {};

	// handler
	return function handler(req, res, next){
		//
		// fill the context
		//
		// N.B. map all falsy users to uid=''
		var uid = req.session && req.session.uid || '';
		// cached context?
		if (cache.hasOwnProperty(uid)) {
			req.context = cache[uid];
			next();
		// get and cache context
		} else {
			getCapability(uid, function(err, context){
				// N.B. don't cache negatives
				if (context) {
					cache[uid] = req.context = context;
				}
				next(err);
			});
		}
	};

};
