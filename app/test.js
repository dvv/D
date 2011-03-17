'use strict';

function O(obj){
	//O.prototype.__proto__ = 
	obj.remove = function(db, entity){
		db[entity].remove(obj.id);
	}
}

var obj = {};
