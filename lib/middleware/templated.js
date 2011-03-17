'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

//
// many thanks to documentcloud/underscore
//

// Escape special HTML entities
function escapeHTML(x) {
	return (x == null) ? '' :
		String(x)
		.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;')
		.replace(/</g, '&lt;').replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
		// FIXME: single quotes?!
}

// define template syntax
var templateSettings = {
	//evaluate		: /<%([\s\S]+?)%>/g,
	//interpolate : /<%=([\s\S]+?)%>/g,
	//escape			: /<%!([\s\S]+?)%>/g
	evaluate: /\{\{([\s\S]+?)\}\}/g,
	interpolate: /\$\$\{([\s\S]+?)\}/g,
	escape: /\$\{([\s\S]+?)\}/g
};

// template parser
function template(str, data, settings) {
	var c	= settings || templateSettings;
	var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
		'with(obj||{}){__p.push(\'' +
		str.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(c.interpolate, function(match, code) {
			return "'," + code.replace(/\\'/g, "'") + ",'";
		})
		.replace(c.escape || null, function(match, code) {
			return "'," + escapeHTML(code.replace(/\\'/g, "'")) + ",'";
		})
		.replace(c.evaluate || null, function(match, code) {
			return "');" + code.replace(/\\'/g, "'")
													.replace(/[\r\n\t]/g, ' ') + "__p.push('";
		})
		.replace(/\r/g, '\\r')
		.replace(/\n/g, '\\n')
		.replace(/\t/g, '\\t')
		+ "');}return __p.join('');";
	var func = new Function('obj', tmpl);
	return data ? func(data) : func;
};

//
// serve templated output, data from req.context
//
module.exports = function setup(options) {

	// setup
	if (options == null) {
		options = {};
	}
	var Fs = require('fs');

	var tmplSyntax = options.syntax || templateSettings;

	var ENOENT = require('constants').ENOENT;

	// parsed templates cache
	// N.B. we aggressively cache since we rely on watch/reload
	var cache = {};

	// handler
	return function handler(req, res, next) {
		var file;
		if (req.method === 'GET' && (file = options.map[req.uri.pathname])) {
			if (cache.hasOwnProperty(file)) {
				res.send(cache[file](req.context));
			} else {
				Fs.readFile(file, function(err, html){
					if (err) {
						if (err.errno === ENOENT) {
							next();
						} else {
							next(err);
						}
					} else {
						cache[file] = template(html.toString('utf8'), null, tmplSyntax);
						handler(req, res, next);
					}
				});
			}
		} else {
			next();
		}
	};

};
