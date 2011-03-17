'use strict';

var Middleware = require('./lib');

//
// plugin RQL
// N.B. this implicitly globalizes documentcloud/underscore as basis for database accessors
//
var Db = require('./lib/db');

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
		foo: function(ctx, next, args){
			next(null, args);//+args[0] + +args[1]);
		},
		// CRUD for /Foo
		Foo: {
			// responds to GET /Foo
			query: function(ctx, query, next){
				next(null, ['query', query]);
			},
			// responds to GET /Foo/id
			get: function(ctx, id, next){
				next(null, ['get', id]);
			},
			// responds to PUT /Foo
			update: function(ctx, query, changes, next){
				next(null, ['update', query, changes]);
			},
			// responds to POST /Foo
			add: function(ctx, data, next){
				next(null, ['add', data]);
			},
			// responds to DELETE /Foo
			remove: function(ctx, query, next){
				next(null, ['remove', query]);
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

		// execute MVC
		Middleware.resource('/', 'app'),


		/*Middleware.mount('/Foo', {
			get: function(req, res){
				res.send('GET');
			},
			put: function(req, res){
				res.send('UPDATE');
			},
			delete: function(req, res){
				res.send('REMOVE');
			},
			post: function(req, res){
				res.send('ADD');
			},
			options: function(req, res){
				res.send('OPTIONS');
			}
		}),*/

		function(req, res, next){res.send(req.call);},
		function(req, res, next){res.send('FULLSTOP');},
		//function(req, res, next){res.send(req.context);},

		// manage secure signed cookie which holds logged user id
		Middleware.session({
			secret: 'your secret here',
			session_key: 'sid',
			//timeout: 24*60*60*1000
		}),

		// get user capability
		Middleware.capability(getCapability),

		//function(req, res, next){res.send(typeof req.context.foo);},

		// execute RPC
		Middleware.RPC(),

		//function(req, res, next){res.send(req.body);},

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
