'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

//
// improve HTTP request and response
//
require('./request');
require('./response');

//
// plugin creationix/Stack
//
var Middleware = require('stack');

//
// override error handler to use improved response
//
Middleware.errorHandler = function(req, res, err){
	if (err) {
		console.error('\n' + err.stack + '\n');
		res.send(err);
	} else {
		// 404 = not found
		res.send(null);
	}
};

//
// plugin middleware helpers
//
merge(Middleware, {

	// parse the body into req.body
	body: require('./body'),

	// manage secure signed cookie which holds logged user id
	session: require('cookie-sessions'), // TODO: prefill everything but secret?

	// get user capability
	capability: require('./capability'),

	// RPC handler
	RPC: require('./jsonrpc'),

	// mount a handler onto a URI (and optionally HTTP verb)
	mount: require('./mount'),

	// handle session auth
	authCookie: require('./auth').session,

	// handle basic authentication
	authBasic: require('./auth').basic,

	// serve templated stuff
	templated: require('./templated'),

	// serve static stuff
	'static': require('./static'),

	// log the request and corresponding response
	log: require('./log'),

});

//
// expose
//
module.exports = Middleware;
