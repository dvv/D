'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

//
// console.log helper
//
// TODO: more pleasant helper? eyes.js?
//
var sys = require('util');
console.log = function(){
	for (var i = 0, l = arguments.lenght; i < l; ++i) {
		console.error(sys.inspect(arguments[i], false, 10));
	}
};

//
// merge helper
//
global.merge = function merge(a, b){
	if (a && b) {
		for (var key in b) {
			a[key] = b[key];
		}
	}
	return a;
};

//
// plugin flow helpers: Next, All
//
require('./flow');

//
// plugin middleware
//
module.exports = require('./middleware');
