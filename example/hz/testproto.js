'use strict';

function X(){}
X.prototype.m = function(x1,x2,x3,x4,x5){}

var _ = require('underscore');

var x = new X();
var xx = {
	//m0: x.m.bind(null,1,2),
	//m: x.m.bind(null,1,2,3,4)
	m0: _.bind(x.m, null,1,2),
	m: _.bind(x.m, null,1,2,3,4)
};

console.log('unbound', x.m.length); // 5
console.log('bound1', xx.m.length, xx.m0.length); // 1 1
