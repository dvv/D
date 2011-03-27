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
(function(){
var sys = require('util');
var _consoleLog = console.log
console.log1 = function(){
	for (var i = 0, l = arguments.lenght; i < l; ++i) {
		_consoleLog(sys.inspect(arguments[i], false, 10));
	}
};
})();

// Extend a given object with all the properties in passed-in object(s).
// From underscore.js (http://documentcloud.github.com/underscore/)
global.extend = function extend(obj) {
	Array.prototype.slice.call(arguments).forEach(function(source){
		for (var prop in source) obj[prop] = source[prop];
	});
	return obj;
};

//
// plugin flow helpers: Next
//
require('./flow');

//
// plugin middleware
//
module.exports = require('./middleware');

//
// plugin mongo store
//
global._ = require('underscore');
require('underscore-data')
module.exports.Database = require('./database');
