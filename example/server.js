'use strict';

var Middleware = require('../lib');

//
// plugin RQL
// N.B. this implicitly globalizes documentcloud/underscore as basis for database accessors
//
var Db = require('../lib/db');

//
// config
//
var config = require('./config');

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
				next(null, ['Query', query]);
			},
			// responds to GET /Foo/id
			get: function(ctx, id, next){
				next(null, ['Get', id]);
			},
			// responds to PUT /Foo
			update: function(ctx, query, changes, next){
				next(null, ['Update', query, changes]);
			},
			// responds to POST /Foo
			add: function(ctx, data, next){
				next(null, ['Add', data]);
			},
			// responds to DELETE /Foo
			remove: function(ctx, query, next){
				next(null, ['Remove', query]);
			}
		},
		auth1: {
		},
		profile: {
			query: function(ctx, query, next){
				next(null, {GOTPROFILE: ctx.user});
			},
			update: function(ctx, query, changes, next){
				next(null, {PUTPROFILE: changes});
			}
		}
	};
	Object.defineProperties(caps, {
		user: {
			get: function(){
				return {
					id: 'HZ'
				};
			}
		}
	});
	next(null, caps);
}

//
// run cluster
//
var server = require('stereo')(null, config.server);

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
	Next({},
		//
		// setup DB model
		//
		function(err, result, next){
			new Db(config.database.url, require('./schema'), next);
		},
		//
		// define application
		//
		function(err, exposed, next){
			this.model = exposed;
			require('./app')(config, this.model, next);
		},
		//
		// define middleware
		//
		function(err, app, next){
			server.on('request', Middleware(

				// parse the body into req.body
				Middleware.body(),

				// manage secure signed cookie which holds logged user id
				Middleware.session({
					secret: 'your secret here',
					session_key: 'sid',
					//timeout: 24*60*60*1000
				}),
				// handle session auth
				Middleware.mount('POST', '/auth', Middleware.authCookie(app.checkCredentials)),

				// get user capability
				Middleware.capability(app.getCapability),

				// ReST
				Middleware.rest('/', {
					jsonrpc: '2.0',
					putNew: '_new'
				}),

				// serve dynamic stuff under ./public
				// use to serve chrome page
				Middleware.templated({
					map: {
						'/': __dirname + '/public/index.html'
					}
				}),

				// serve static stuff under ./public
				Middleware.static('/', __dirname + '/public', false/*'index.html'*/, {
					//cacheMaxFileSizeToCache: 1024, // set to limit the size of cacheable file
				})

			));
		}
	);

//
// master process
//
} else {

	//
	// broadcast a message
	//
	setTimeout(function(){process.publish({sos: 'to all, all, all'});}, 2000);

}
