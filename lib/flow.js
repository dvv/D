'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

//
// simplified version of creationix/Step
//

var __slice = Array.prototype.slice;

global.Next = function(context /*, steps*/) {
  var steps = __slice.call(arguments, 1);
  var next = function(err, result) {
    var fn = steps.shift();
    if (fn) {
      try {
        fn.call(context, err, result, next);
      } catch (err) {
        next(err);
      }
    } else {
      if (err) {
        throw err;
      }
    }
  };
  next();
};

Next.nop = function() {};
