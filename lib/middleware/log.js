'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

//
// log request and corresponding response
//
module.exports = function setup(options) {

	// setup
	if (options == null) {
		options = {};
	}

	// handler
	return function(req, res, next) {
		var send = res.send;
		res.send = function() {
			process.log(("REQUEST " + req.method + " " + req.url + " ") + JSON.stringify(req.body) + " -- RESPONSE " + JSON.stringify(arguments));
			send.apply(this, arguments);
		};
		next();
	};

};
