'use strict';

var util = require('util');

// Extend a given object with all the properties in passed-in object(s).
// From underscore.js (http://documentcloud.github.com/underscore/)
global.extend = function extend(obj) {
	Array.prototype.slice.call(arguments).forEach(function(source){
		for (var prop in source) obj[prop] = source[prop];
	});
	return obj;
};

var db = require('mongoose');
db.connect('mongodb://localhost/test');

var Schema = db.Schema, ObjectId = Schema.ObjectId;

var Country = new Schema({
	name: {type: String, required: true},
});

var Language = new Schema({
	name: {type: String, required: true},
	localName: String,
	speakers: [Country],
});

// FIXME: definition should also return the model!
db.model('Language', Language);
var model = db.model('Language');

var x = new model({name: 'en'});
x.speakers.push({
	name: 'England',
});
x.speakers.push({
	name: 'North America',
});
x.save();

extend(require('repl').start('db>').context, {
	db: db,
	model: model,
});
