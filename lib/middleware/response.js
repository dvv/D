'use strict';

/*
 *
 * Simple
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

var fs = require('fs');
var http = require('http');
var lookupMimeType = require('simple-mime')('application/octet-stream');

http.ServerResponse.prototype.send = function(body, headers, status) {
	var k, mime, t, v, _ref, _ref2;
	if (typeof headers === 'number') {
		status = headers;
		headers = null;
	}
	headers != null ? headers : headers = {};
	(_ref = this.headers) != null ? _ref : this.headers = {};
	// error types determine status
	if (body instanceof Error) {
		if (body instanceof URIError) {
			status = 400;
			body = body.message;
		} else if (body instanceof TypeError) {
			body = 403;
		} else if (body instanceof SyntaxError) {
			status = 406;
			body = body.message;
		} else {
			status = body.status || 500;
			if (status === 500) {
				body = body.stack;//process.errorHandler(body);
			}
			delete body.stack;
			delete body.message;
			delete body.status;
		}
	// true means OK with no content
	} else if (body === true) {
		body = 204;
	// false means "format error"
	} else if (body === false) {
		body = 406;
	// null means "not found"
	} else if (body === null) {
		body = 404;
	}
	if (!body) {
		status != null ? status : status = 204;
	} else if ((t = typeof body) === 'number') {
		status = body;
		if (body < 300) {
			if (!this.headers['content-type']) {
				this.contentType('.json');
			}
			body = '{}';
		} else {
			if (!this.headers['content-type']) {
				this.contentType('.txt');
			}
			body = http.STATUS_CODES[status];
		}
	// string means HTML
	} else if (t === 'string') {
		if (!this.headers['content-type']) {
			this.contentType('.html');
		}
	// object or array means JSON
	} else if (t === 'object' || body instanceof Array) {
		if (body.body || body.headers || body.status) {
			if (body.headers) {
				this.headers = body.headers;
			}
			if (body.status) {
				status = body.status;
			}
			body = body.body || '';
			return this.send(body, status);
		// buffer means octet stream
		} else if (body instanceof Buffer) {
			if (!this.headers['content-type']) {
				this.contentType('.bin');
			}
		/***} else if (body instanceof Stream) {
			if (!this.headers['content-type']) {
				this.contentType('.bin');
			}***/
		} else {
			if (!this.headers['content-type']) {
				this.contentType('.json');
				try {
					if (body instanceof Array && body.totalCount) {
						this.headers['content-range'] = 'items=' + body.start + '-' + body.end + '/' + body.totalCount;
					}
					body = JSON.stringify(body);
					/***if ((_ref2 = this.req.query) != null ? _ref2.callback : void 0) {
						body = this.req.query.callback.replace(/[^\w$.]/g, '') + '(' + body + ');';
					}***/
				} catch (err) {
					console.error(err);
					body = 'HZ: ' + err.stack;
				}
			} else {
				mime = this.headers['content-type'];
				body = serialize(body, mime);
			}
		}
	// function means object with mime application/javascript
	} else if (typeof body === 'function') {
		if (!this.headers['content-type']) {
			this.contentType('.js');
		}
		body = body.toString();
	// UNHANDLED CASE SO FAR
	} else {
		console.log('BODY!!!', t, body);
		if (!this.headers['content-length']) {
			this.headers['content-length'] = (body instanceof Buffer ? body.length : Buffer.byteLength(body));
		}
	}
	// merge headers
	for (k in headers) {
		v = headers[k];
		this.headers[k] = v;
	}
	// finalize the response
	this.writeHead(status || 200, this.headers);
	return this.end(body);
};

http.ServerResponse.prototype.contentType = function(type) {
	return this.headers['content-type'] = lookupMimeType(type);
};

http.ServerResponse.prototype.redirect = function(url) {
	this.writeHead(302, {location: url});
	this.end();
};
