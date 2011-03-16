'use strict';

function a1(x1){}
function a2(x1,x2){}
function a3(x1,x2,x3){}
function a4(x1,x2,x3,x4){}
function a5(x1,x2,x3,x4,x5){}
function a6(x1,x2,x3,x4,x5,x6){}
function a7(x1,x2,x3,x4,x5,x6,x7){}
function a8(x1,x2,x3,x4,x5,x6,x7,x8){}
function a9(x1,x2,x3,x4,x5,x6,x7,x8,x9){}

console.log('unbound');
console.log('1', a1.length);
console.log('2', a2.length);
console.log('3', a3.length);
console.log('4', a4.length);
console.log('5', a5.length);
console.log('6', a6.length);
console.log('7', a7.length);
console.log('8', a8.length);
console.log('9', a9.length);

console.log('bound 1');
console.log('1', a1.bind(1).length);
console.log('2', a2.bind(1).length);
console.log('3', a3.bind(1).length);
console.log('4', a4.bind(1).length);
console.log('5', a5.bind(1).length);
console.log('6', a6.bind(1).length);
console.log('7', a7.bind(1).length);
console.log('8', a8.bind(1).length);
console.log('9', a9.bind(1).length);

console.log('bound 2');
console.log('1', a1.bind(1,2).length);
console.log('2', a2.bind(1,2).length);
console.log('3', a3.bind(1,2).length);
console.log('4', a4.bind(1,2).length);
console.log('5', a5.bind(1,2).length);
console.log('6', a6.bind(1,2).length);
console.log('7', a7.bind(1,2).length);
console.log('8', a8.bind(1,2).length);
console.log('9', a9.bind(1,2).length);

console.log('bound 3');
console.log('1', a1.bind(1,2,3).length);
console.log('2', a2.bind(1,2,3).length);
console.log('3', a3.bind(1,2,3).length);
console.log('4', a4.bind(1,2,3).length);
console.log('5', a5.bind(1,2,3).length);
console.log('6', a6.bind(1,2,3).length);
console.log('7', a7.bind(1,2,3).length);
console.log('8', a8.bind(1,2,3).length);
console.log('9', a9.bind(1,2,3).length);

console.log('bound 4');
console.log('1', a1.bind(1,2,3,4).length);
console.log('2', a2.bind(1,2,3,4).length);
console.log('3', a3.bind(1,2,3,4).length);
console.log('4', a4.bind(1,2,3,4).length);
console.log('5', a5.bind(1,2,3,4).length);
console.log('6', a6.bind(1,2,3,4).length);
console.log('7', a7.bind(1,2,3,4).length);
console.log('8', a8.bind(1,2,3,4).length);
console.log('9', a9.bind(1,2,3,4).length);

console.log('bound a4');
var x = {
	x1: a4.bind(1,2),
	x2: a4.bind(1,2,3,4)
};
console.log('1', x.x1.length);
console.log('2', x.x2.length);
