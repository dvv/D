'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

var __slice = Array.prototype.slice;

//
// convert REST to RPC
//
// see tests below for explanation
//
function convertRESTtoRPC(method, uri, query, body) {

	//
	// split to resource path and resource id
	//
	var call, id, parts, _i, _ref;
	_ref = uri.substring(1).split('/').map(function(x) {
		return decodeURIComponent(x);
	}), parts = 2 <= _ref.length ? __slice.call(_ref, 0, _i = _ref.length - 1) : (_i = 0, []), id = _ref[_i++];
	if (parts.length === 0) {
		parts = [id];
		id = void 0;
	}

	//
	// GET /Foo[?query] --> RPC {method: ['Foo', 'query'], params: [query]}
	// GET /Foo/ID[?query] --> RPC {method: ['Foo', 'get'], params: [ID]}
	//
	if (method === 'GET') {
		call = {
			method: 'query',
			params: [query]
		};
		if (id) {
			call.method = 'get';
			call.params[0] = id;
		}

	//
	// PUT /Foo[?query] {changes} --> RPC {method: ['Foo', 'update'], params: [query, changes]}
	// PUT /Foo/ID[?query] {changes} --> RPC {method: ['Foo', 'update'], params: [[ID], changes]}
	// PUT /Foo[/ID][?query] [ids, changes] --> RPC {method: ['Foo', 'update'], params: [ids, changes]}
	//
	} else if (method === 'PUT') {
		call = {
			method: 'update',
			params: [query, body]
		};
		if (id) {
			call.params[0] = [id];
		}
		if (Array.isArray(body)) {
			call.params[0] = body[0];
			call.params[1] = body[1];
		}

	//
	// POST /Foo {data} --> RPC {method: ['Foo', 'add'], params: [data]}
	//
	} else if (method === 'POST') {
		call = {
			method: 'add',
			params: [body]
		};

	//
	// DELETE /Foo[?query] --> RPC {method: ['Foo', 'remove'], params: [query]}
	// DELETE /Foo/ID[?query] --> RPC {method: ['Foo', 'remove'], params: [[ID]]}
	// DELETE /Foo[/ID][?query] [ids] --> RPC {method: ['Foo', 'remove'], params: [ids]}
	//
	} else if (method === 'DELETE') {
		call = {
			method: 'remove',
			params: [query]
		};
		if (id) {
			call.params[0] = [id];
		}
		if (Array.isArray(body)) {
			call.params = [body];
		}

	//
	// verb not supported
	//
	} else {
		return;
	}

	// honor parts[0:-1]
	if (parts[0] !== '') {
		call.method = parts.concat(call.method);
	}

	return call;
};

//
// call a method named `req.body.method` of req.context with `req.body.params` arguments
//
// depends on req.body
//
module.exports = function setup(){

	// setup

	// handler
	return function (req, res, next){

		//
		// if body doesn't look like RPC -- convert REST to JSONRPC
		//
		var body = req.body;
		if (!(body.jsonrpc && body.method && body.params)) {
			// URL and method both define RPC method
			body = convertRESTtoRPC(req.method, req.uri.pathname, decodeURI(req.uri.search), body);
			//process.log('RPC', body);
		}

		//
		// find RPC handler
		//
		var fn = req.context;
		var method = body.method;
		// method is an array ->
		if (Array.isArray(method)) {
			// each element defines a drill-down step
			for (var i = 0, l = method.length; i < l; ++i) {
				fn = fn && fn[method[i]];
			}
		// method is ordinal ->
		} else {
			// simple lookup
			fn = fn && fn[method];
		}
		//
		// call RPC handler
		//
		Next(req.context,
			// safely call the handler
			function(err, result, step){
				// no handler?
				//if (!fn) return body.jsonrpc ? step('notfound') : next();
				if (!fn) return step('notfound');
				// compose arguments from params
				// FIXME: we should check parameters for truly RPC!
				var params = body.params;
				var args = Array.isArray(params) ? params.slice() : params ? [params] : [];
				// the first argument is the context
				args.unshift(req.context);
				// the last argument is the next step
				args.push(step);
				// FIXME: can't rely on arity of bound functions...
				// THIS CAN BE MAJOR FLAW!!!
				// check if handler's arity equals arguments length
				//if (args.length !== fn.length) { return step('Invalid method signature'); }
				// provide null as `this` to not leak info
				fn.apply(null, args);
			},
			// respond
			function(err, result){
				var response;
				// wrap to JSONRPC format if truly JSONRPC
				// FIXME: ALWAYS WRAP?!
				//if (body.jsonrpc) {
					response = {
						jsonrpc: req.body.jsonrpc
					};
					if (err) {
						process.log(err.stack);
						response.error = err.message || err;
					} else if (result === void 0) {
						response.result = true;
					} else {
						response.result = result;
					}
					res.send(response);
				// plain response
				/*} else {
					if (err) {
						res.send(err.message || err, null, 406);
					} else {
						res.send(result);
					}
				}*/
			}
		);
	};

};

//
// tests
//
var assert = require('assert');
var id = 'I-D';
var query = 'a=b&select(c)';
var tests = [
	[
		['GET', '/', '', {}], {
			method: 'query',
			params: ['']
		}
	], [
		['GET', '/ /	/', '', {}], {
			method: [' ', '	', 'query'],
			params: ['']
		}
	], [
		['GET', '/', query, {}], {
			method: 'query',
			params: [query]
		}
	], [
		['GET', '/ /	/', query, {}], {
			method: [' ', '	', 'query'],
			params: [query]
		}
	], [
		['GET', '/Foo', query, {}], {
			method: ['Foo', 'query'],
			params: [query]
		}
	], [
		[
			'GET', '/Foo', query, {
				foo: 123
			}
		], {
			method: ['Foo', 'query'],
			params: [query]
		}
	], [
		['GET', '/Foo', query, [123]], {
			method: ['Foo', 'query'],
			params: [query]
		}
	], [
		['GET', "/Foo/" + id, '', {}], {
			method: ['Foo', 'get'],
			params: [id]
		}
	], [
		['GET', "/Foo/" + id, '', ''], {
			method: ['Foo', 'get'],
			params: [id]
		}
	], [
		['GET', "/Foo/" + id, query, void 0], {
			method: ['Foo', 'get'],
			params: [id]
		}
	], [
		['GET', "/Foo/a'/" + id, query, null], {
			method: ['Foo', "a'", 'get'],
			params: [id]
		}
	], [
		['DELETE', '/', '', {}], {
			method: 'remove',
			params: ['']
		}
	], [
		['DELETE', '/ /	/', '', {}], {
			method: [' ', '	', 'remove'],
			params: ['']
		}
	], [
		['DELETE', '/Foo', query, {}], {
			method: ['Foo', 'remove'],
			params: [query]
		}
	], [
		[
			'DELETE', '/Foo', query, {
				foo: 123
			}
		], {
			method: ['Foo', 'remove'],
			params: [query]
		}
	], [
		['DELETE', '/Foo', query, [123, 456, null, void 0]], {
			method: ['Foo', 'remove'],
			params: [[123, 456, null, void 0]]
		}
	], [
		['DELETE', "/Foo/" + id, '', {}], {
			method: ['Foo', 'remove'],
			params: [[id]]
		}
	], [
		['DELETE', "/Foo/" + id, '', ''], {
			method: ['Foo', 'remove'],
			params: [[id]]
		}
	], [
		['DELETE', "/Foo/" + id, query, void 0], {
			method: ['Foo', 'remove'],
			params: [[id]]
		}
	], [
		['DELETE', "/Foo/a'/" + id, query, null], {
			method: ['Foo', "a'", 'remove'],
			params: [[id]]
		}
	], [
		['DELETE', "/Foo/a'/" + id, query, ['q', 'w', 'e/r/t']], {
			method: ['Foo', "a'", 'remove'],
			params: [['q', 'w', 'e/r/t']]
		}
	], [
		['PUT', '/', '', {}], {
			method: 'update',
			params: ['', {}]
		}
	], [
		['PUT', '/ /	/', '', {}], {
			method: [' ', '	', 'update'],
			params: ['', {}]
		}
	], [
		['PUT', '/Foo', query, {}], {
			method: ['Foo', 'update'],
			params: [query, {}]
		}
	], [
		[
			'PUT', '/Foo', query, {
				foo: 123
			}
		], {
			method: ['Foo', 'update'],
			params: [
				query, {
					foo: 123
				}
			]
		}
	], [
		['PUT', '/Foo', query, [123, 456, null, void 0]], {
			method: ['Foo', 'update'],
			params: [123, 456]
		}
	], [
		['PUT', "/Foo/" + id, '', {}], {
			method: ['Foo', 'update'],
			params: [[id], {}]
		}
	], [
		['PUT', "/Foo/" + id, '', ''], {
			method: ['Foo', 'update'],
			params: [[id], '']
		}
	], [
		['PUT', "/Foo/" + id, query, void 0], {
			method: ['Foo', 'update'],
			params: [[id], void 0]
		}
	], [
		['PUT', "/Foo/a'/" + id, query, null], {
			method: ['Foo', "a'", 'update'],
			params: [[id], null]
		}
	], [
		['PUT', "/Foo/a'/" + id, query, ['q', 'w', 'e/r/t']], {
			method: ['Foo', "a'", 'update'],
			params: ['q', 'w']
		}
	], [
		['POST', '/', '', {}], {
			method: 'add',
			params: [{}]
		}
	], [
		['POST', '/ /	/', '', {}], {
			method: [' ', '	', 'add'],
			params: [{}]
		}
	], [
		['POST', '/Foo', query, {}], {
			method: ['Foo', 'add'],
			params: [{}]
		}
	], [
		[
			'POST', '/Foo', query, {
				foo: 123
			}
		], {
			method: ['Foo', 'add'],
			params: [
				{
					foo: 123
				}
			]
		}
	], [
		['POST', '/Foo', query, [123, 456, null, void 0]], {
			method: ['Foo', 'add'],
			params: [[123, 456, null, void 0]]
		}
	], [
		['POST', "/Foo/" + id, '', {}], {
			method: ['Foo', 'add'],
			params: [{}]
		}
	], [
		['POST', "/Foo/" + id, '', ''], {
			method: ['Foo', 'add'],
			params: ['']
		}
	], [
		['POST', "/Foo/" + id, query, void 0], {
			method: ['Foo', 'add'],
			params: [void 0]
		}
	], [
		['POST', "/Foo/a'/" + id, query, null], {
			method: ['Foo', "a'", 'add'],
			params: [null]
		}
	], [
		['POST', "/Foo/a'/" + id, query, ['q', 'w', 'e/r/t']], {
			method: ['Foo', "a'", 'add'],
			params: [['q', 'w', 'e/r/t']]
		}
	]
];
tests.forEach(function(test) {
	assert.deepEqual(convertRESTtoRPC.apply(null, test[0]), test[1]);
});
