'use strict';

var resource = {

	//
	// query resource
	//
	get: function(req, res, next, entity, id){
		var call;
		// get by ID
		if (id && id !== '_new') {
			call = ['get', id];
		// query
		} else {
			// bulk get via POST X-HTTP-Method-Override: GET
			if (Array.isArray(req.body)) {
				call = ['get', req.body];
			// query by RQL
			} else {
				call = ['query', req.uri.search];
			}
		}
		// ??req.context[req.call[0]]()
		req.call = call;
		next();
	},

	//
	// create new / update resource
	//
	put: function(req, res, next, entity, id){
		var call;
		if (id) {
			// add new
			if (id === '_new') {
				call = ['add', req.body];
			// update by ID
			} else {
				call = ['update', id, req.body];
			}
		} else {
			// bulk update via POST X-HTTP-Method-Override: PUT
			if (Array.isArray(req.body) && Array.isArray(req.body[0])) {
				call = ['update', req.body[0], req.body[1]];
			// update by RQL
			} else {
				call = ['update', req.uri.search, req.body];
			}
		}
		req.call = call;
		next();
	},

	//
	// remove resource
	//
	delete: function(req, res, next, entity, id){
		var call;
		if (id && id !== '_new') {
			call = ['remove', id];
		} else {
			// bulk remove via POST X-HTTP-Method-Override: DELETE
			if (Array.isArray(req.body)) {
				call = ['remove', req.body];
			// remove by RQL
			} else if (req.uri.search) {
				call = ['remove', req.uri.search];
			// won't remove w/o conditions
			} else {
				call = SyntaxError('Specify conditions');
			}
		}
		req.call = call;
		next();
	},

	//
	// arbitrary RPC to resource
	//
	post: function(req, res, next, entity, id){
		var call;
		var method = req.body.method;
		//if (method === '
		call = ['add', req.body];
		req.call = call;
		//next();
		req.send(405);
	},

	//
	// get capabilities of resource
	//
	options: function(req, res, next, entity, id){
		req.send(405);
	},

};

module.exports = resource;
