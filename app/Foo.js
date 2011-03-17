'use strict';

module.exports = {

	//
	// get resource
	//
	get: function(ctx, id, next){
		process.log('GET', arguments);
		next();
	},

	//
	// query resource
	//
	query: function(ctx, query, next){
		process.log('QUERY', arguments);
		next();
	},

	//
	// create new / update resource
	//
	update: function(ctx, query, changes, next){
		process.log('UPDATE', arguments);
		next();
	},

	//
	// create new resource
	//
	add: function(ctx, obj, next){
		process.log('ADD', arguments);
		next();
	},

	//
	// remove resource
	//
	remove: function(ctx, query, next){
		process.log('REMOVE', arguments);
		next();
	},

};
