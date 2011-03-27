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
extend(Middleware, {

	// parse the body into req.body
	body: require('./body'),

	// manage secure signed cookie which holds logged user id
	session: require('cookie-sessions'),

	// get user capability
	capability: require('./capability'),

	// mount a handler onto a URI (and optionally HTTP verb)
	mount: require('./mount'),

	// handle session auth
	authCookie: require('./auth').session,

	// handle basic authentication
	authBasic: require('./auth').basic,

	// serve /<uid> pages
	//homes: require('./homes'),

	// serve templated stuff
	templated: require('./templated'),

	// serve static stuff
	'static': require('./static'),

	// log the request and corresponding response
	log: require('./log'),

	// MVC style controllers
	// TODO: unify with rest -- treat loading modules as getCapability
	controllers: require('./controllers'),

	// ReST resource controller
	rest: require('./rest'),

});

//
// expose
//
module.exports = Middleware;

//
// generate standard middleware stack
//
Middleware.vanilla = function(options){
	options = options || {};
	return Middleware(
		// parse the body into req.body
		Middleware.body(),
		// manage cookie session
		Middleware.session({
			secret: 'your secret here',
			session_key: 'sid',
			//timeout: 24*60*60*1000,
			// TODO:
			//mount: '/auth',
			//checkCredentials: function(uid, password, callback){... callback(!validUser(uid, password));}
		}),
		// handle session auth
		Middleware.mount('POST', '/auth', Middleware.authCookie(checkCredentials)),
		// get user capability
		Middleware.capability(getCapability),
		// ReST handler
		Middleware.rest('/', {jsonrpc: '2.0'}),
		// serve dynamic stuff under ./public
		// useful to serve chrome page
		Middleware.templated({
			map: {
				'/': __dirname + '/public/index.html'
			}
		}),
		// serve static stuff under ./public
		Middleware.static('/', __dirname + '/public', 'index.html', {
			//cacheMaxFileSizeToCache: 1024, // set to limit the size of cacheable file
		})
	);
};
