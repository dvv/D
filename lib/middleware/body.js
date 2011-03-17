'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

//
// fill req.body with object reflecting content of request body
//
module.exports = function setup(options) {

	// setup
	if (options == null) {
		options = {};
	}
	var formidable = require('formidable');
	var qs = require('qs');
	var uploadDir = options.uploadDir || 'upload';

	// known parsers
	function guess(s){
		var c = s.charAt(0);
		return (c === '{' || c === '[') ? JSON.parse(s) : qs.parse(s);
	}
	var parsers = {
		'application/json': JSON.parse,
		'application/www-urlencoded': qs.parse,
		'application/x-www-form-urlencoded': qs.parse,
		'application/xml': guess
	};

	// handler
	return function(req, res, next) {
		// prepare request
		req.parse();
		res.req = req;
		// TODO: res.setHeader is the way to go!
		if (!res.headers) res.headers = {};
		// bodyful request
		//if (req.method === 'POST' || req.method === 'PUT') {
			// get content type. N.B. can't just test equality, charset may be set
			var type = req.headers['content-type'];
			type = (type) ? type.split(';')[0] : 'application/xml';
			//
			// supported content-type
			//
			if (parsers.hasOwnProperty(type)) {
				// set body encoding
				// FIXME: shouldn't honor possible charset from Content-Type: ?
				req.setEncoding('utf8');
				// collect the body
				var body = '';
				var len = options.maxLength;
				req.on('data', function(chunk) {
					body += chunk;
					// control max body length
					if (body.length > len && len > 0) {
						next(SyntaxError('Length exceeded'));
					}
				});
				// bump on read error
				req.on('error', function(err) {
					next(err);
				});
				// body collected -> parse it at once
				req.on('end', function() {
					try {
						//return res.send(null, [req.body]);
						req.body = parsers[type](body);
					} catch (err) {
						// catch parse errors
						return next(SyntaxError('Bad body'));
					}
					next();
				});
			//
			// formidable
			//
			} else if (type === 'multipart/form-data') {
				// setup the form reader
				var form = new formidable.IncomingForm();
				form.uploadDir = uploadDir;
				if (options.maxLength) {
					form.maxFieldsSize = options.maxLength;
				}
				// file uploaded ->
				form.on('file', function(field, file) {
					// ... treat as vanilla field
					form.emit('field', field, file);
				});
				// field encountered ->
				form.on('field', function(field, value) {
					// ... pack same-named fields into arrays
					if (!req.body[field]) {
						req.body[field] = value;
					} else if (!Array.isArray(req.body[field])) {
						req.body[field] = [req.body[field], value];
					} else {
						req.body[field].push(value);
					}
				});
				// bump on error
				form.on('error', function(err) {
					next(SyntaxError(err.message || err));
				});
				// form is done ->
				form.on('end', function() {
					// ... proceed
					next();
				});
				// parse the body
				form.parse(req);
			} else {
				next();
			}
		//} else {
		//	return next();
		//}
	};
};
