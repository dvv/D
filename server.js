'use strict';

var Middleware = require('./lib');

//
// authentication helper
//
function checkCredentials(user, pass, next){
	var ok = user === 'root' && pass === '123';
	next(!ok);
}

//
// capability getter
//
// each method takes context as the first arg, and callback as the last
//
function getCapability(uid, next){
	var caps = {
		foo: function(ctx, p1, p2, next){
			next(null, +p1 + +p2);
		},
		// CRUD for /Foo
		Foo: {
			// responds to GET /Foo
			query: function(ctx, query, next){
				next(null, [query]);
			},
			// responds to GET /Foo/id
			get: function(ctx, id, next){
				next(null, [id]);
			},
			// responds to PUT /Foo
			update: function(ctx, query, changes, next){
				next(null, [query, changes]);
			},
			// responds to POST /Foo
			add: function(ctx, data, next){
				next(null, [data]);
			},
			// responds to DELETE /Foo
			remove: function(ctx, query, next){
				next(null, [query]);
			}
		}
	};
	next(null, caps);
}

//
// run cluster
//
var server = require('stereo')(null, {
	port: 3000,
	repl: true,
	workers: 1,
	watch: [__filename, 'app', 'lib']
});

//
// worker process
//
if (server) {

	//
	// inter-workers message arrives
	//
	process.on('message', function(message){
		console.log(JSON.stringify(message));
	});

	//
	// setup the server
	//
	//
	// middleware
	//
	server.on('request', Middleware(

		// parse the body into req.body
		Middleware.body(),

		// manage secure signed cookie which holds logged user id
		Middleware.session({
			secret: 'your secret here',
			session_key: 'sid',
			//timeout: 24*60*60*1000
		}),

		// get user capability
		Middleware.capability(getCapability),

		// execute RPC
		Middleware.RPC(),

/*
		function(req, res, next){
			res.send(req.body);
		},
*/

		// handle session auth
		Middleware.mount('POST', '/auth', Middleware.authCookie(checkCredentials)),

		// serve dynamic stuff under ./public
		// use to serve chrome page
		Middleware.templated({
			map: {
				'/': __dirname + '/public/index.html'
			}
		}),

		// serve static stuff under ./public
		Middleware.static('/', __dirname + '/public', 'index.html', {
			//cacheMaxFileSizeToCache: 1024, // set to limit the size of cacheable file
			//cacheTTL: 1000
		})

		//Middleware.autBasic(checkCredentials),

	));

//
// master process
//
} else {

	//
	// broadcast a message
	//
	setTimeout(function(){process.publish({sos: 'to all, all, all'});}, 2000);

}
