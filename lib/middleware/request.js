'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

var http = require('http');
var parseUrl = require('url').parse;
var path = require('path');

// regexp to check for valid IP string
var REGEXP_IP = /^\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}$/;

http.IncomingMessage.prototype.parse = function() {
	// swallow .. and other URL quirks
	this.url = path.normalize(this.url);
	// parse URL
	this.uri = parseUrl(this.url);
	// default body and parameters
	this.body = this.params = {};
	// default context
	this.context = {
		user: {}
	};
	// skip leading ? in querystring
	this.uri.search = (this.uri.search || '').substring(1);
	// honor X-Forwarded-For: possibly set by a reverse proxy
	var s;
	if (s = this.headers['x-forwarded-for']) {
		if (REGEXP_IP.test(s)) {
			this.socket.remoteAddress = s;
		}
		// forget the source of knowledge
		delete this.headers['x-forwarded-for'];
	}
	// honor method override
	if (this.headers['x-http-method-override']) {
		this.method = this.headers['x-http-method-override'];
		// forget the source of knowledge
		delete this.headers['x-http-method-override'];
	}
	// sanitize headers
	// N.B. special case: Referer: <-> Referrer:
	var headers = this.headers;
	var referrer = headers.referrer || headers.referer;
	if (referrer !== void 0) {
		headers.referrer = headers.referer = referrer;
	}
	// sanitize method
	var method = this.method = this.method.toUpperCase();
	// define security properties
	/***
	Object.defineProperties(this, {
		// whether request is AJAX one
		xhr: {
			get: function(){
				return headers['x-requested-with'] === 'XMLHttpRequest';
			}
		},
		// whether request is Cross-Site-Forgeable
		csrf: {
			get: function(){
				return (!(this.xhr || /application\/j/.test(headers.accept) || (method === 'POST' && (referrer != null ? referrer.indexOf(headers.host + '/') : void 0) > 0) || (method !== 'GET' && method !== 'POST')));
			}
		}
	});***/
	//
	return this;
};
