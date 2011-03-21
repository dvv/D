'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

//
// call a `method` with `params` of context of user `uid`
//
// `nowjs` defines whether to not pass error to the callback
//
module.exports = function setup(getCapability, nowjs){

	// setup

	// handler
	return function (uid, method, params, next){

		Next({},
			//
			// get capability
			//
			function(err, result, step){
				getCapability(uid, step);
			},
			//
			// call the handler
			//
			function(err, context, step){
				if (err) return step(err);
				// find RPC handler
				var fn = context;
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
				// no handler?
				if (!fn) return step('notfound');
				// compose arguments from params
				var args = params ? params : [];
				// the first argument is the context
				args.unshift(context);
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
				process.log('RPC?', arguments);
				var response = {
					//jsonrpc: '2.0'
				};
				if (err) {
					process.log(err.stack);
					response.error = err.message || err;
				} else if (result === void 0) {
					response.result = true;
				} else {
					response.result = result;
				}
				process.log('RPC!', response);
				nowjs ? next(response) : next(null, response);
			}
		);
	};

};
