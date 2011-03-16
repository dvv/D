'use strict';

/*
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
*/

var __slice = Array.prototype.slice;
global.Next = function() {
  var context, next, steps;
  context = arguments[0], steps = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  next = function(err, result) {
    var fn;
    fn = steps.shift();
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

/***
global.All = function() {
  var context, next, steps;
  context = arguments[0], steps = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  next = function(err, result) {
    var fn;
    if (err) {
      throw err;
    }
    fn = steps.shift();
    if (fn) {
      try {
        fn.call(context, err, result, next);
      } catch (err) {
        console.log('FATAL: ' + err.stack);
        process.exit(1);
      }
    } else {
      if (err) {
        console.log('FATAL: ' + err.stack);
        process.exit(1);
      }
    }
  };
  next();
};
***/
