'use strict'

class X
	m: (x1,x2,x3,x4,x5) ->
	b: () ->
		self = @
		xx = {
			m0: self.m.bind self, 1, 2
			m: self.m.bind self, 1, 2, 3
		}

x = new X
b = x.b()

console.log 'unbound', x.m.length
console.log 'bound1', b.m.length, b.m0.length
