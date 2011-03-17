'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

//
// session auth
//
// @validate function(user, pass, next){next(!valid(user, pass));}
//
module.exports.session = function setup(validate){

	// setup

	// handler
	return function(req, res, next){
		var uid = req.body.id;
		// logout
		if (!uid) {
			delete req.session;
			res.send(true);
		// login
		} else {
			validate(uid, req.body.password, function(err, user){
				if (err) {
					delete req.session;
					res.send('Bad user', null, 403);
				} else {
					req.session = {uid: uid};
					res.send(true);
				}
			});
		}
	};

};

//
// basic auth
//
// @validate function(user, pass, next){next(!valid(user, pass));}
//
module.exports.basic = function setup(validate){

	// setup
	var Crypto = require('crypto');

	function unauthorized(res){
		res.send('Authorization Required', {
			'WWW-Authenticate': 'Basic realm="Secure Area"',
			'Content-Type': 'text/plain'
		}, 401);
	}

	// handler
	return function(req, res, next){
		//if (req.socket.remoteAddress === '127.0.0.1' && req.headers.authorization) {
		if (req.headers.authorization) {
			var parts = req.headers.authorization.split(' ');
			parts = (new Buffer(parts[1], 'base64')).toString('utf8').split(':');
			var uid = parts[0];
			var password = parts[1];
			// validate secret
			validate(uid, password, function(err, user){
				if (err) return unauthorized(res);
				// pass if auth is ok
				next();
			});
		} else {
			unauthorized(res);
		}
	};

};
