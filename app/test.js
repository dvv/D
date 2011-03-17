'use strict';

module.exports = {

	index: function(req, res, next, id){
		res.send([id !== undefined ? 'get' : 'query', id]);
	},

	index1: function(ctx, next, args){
		//next(SyntaxError(JSON.stringify([{p: 1}])), [this, args]);
		next(null, [ctx, args]);
	},

	qqq: function(ctx, next, args){
		//next(SyntaxError(JSON.stringify([{p: 1}])), [this, args]);
		next(null, [ctx, args]);
	},

};
