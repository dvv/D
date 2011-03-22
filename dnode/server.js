'use strict';

/*
 * TODO:
 * 1. just static/dynamic provider
 * 2. all stuff is via dnode
 */

var Middleware = require('../lib');

//
// plugin RQL
// N.B. this implicitly globalizes documentcloud/underscore as basis for database accessors
//
var Db = require('../lib/db');
_.traverse = require('traverse');

//
// config
//
var config = require('./config');

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
		// define ???
		//
		function(err, app, next){

			//
			// setup middleware
			//
			server.on('request', Middleware(

				// parse the body into req.body
				Middleware.body(),

				// fallback if DNode down?

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
					putNew: '_new' // PUT /Foo/_new {data} creates new document
				}),

				// serve dynamic stuff under ./public
				// use to serve chrome page
				/*Middleware.templated({
					map: {
						'/': __dirname + '/public/index.html'
					}
				}),*/

				// serve static stuff under ./public
				Middleware.static('/', __dirname + '/public', 'index.html', {
					//cacheMaxFileSizeToCache: 1024, // set to limit the size of cacheable file
				}),

				// workaround since we are not connect/express ;)
				//
				// TODO: ping developers!
				//
				require('dnode/lib/web.js').route('/dnode.js')

			));

			//
			// setup DNode
			//
			var DNode = require('dnode');
			DNode(function(client, connection){
				// TODO: reconnect
				//connection.on('end', function(){
				//	process.log('User ', user, ' disconnected');
				//});
				var remote = this;
				//
				// given user credentials, return user context
				//
				remote.authenticate = function(uid, password, next){
					Next({},
						function(err, hz, step){
							app.checkCredentials(uid, password, function(err, context){
								// strip secrets from user
								if (!err) {
									var user = context.user;
									context.user = {
										id: user.id,
										email: user.email,
										type: user.type
									};
									remote.user = context.user;
									delete context.user;
								}
								step(err, context);
							});
						},
						function(err, context, step){
							// bind handlers to the context
							context = _.traverse(context).map(function(f){
								if (typeof f === 'function' && f.bind) {
									return f.bind(null, context);
								} else {
									return f;
								}
							});
							/*
							// test for calling browser func
							remote.quote = function(cb){
								client.notify('uuu/ooo', function(){});
								cb(Math.random());
							};
							//
							remote.rql = function(arg, cb){
								process.log('ARG: ', JSON.stringify(arg));
								cb(arg);
							};*/
							// expose capabilities
							remote.caps = context;
							next(remote);
						}
					);
				};
				remote.broadcast = function(msg, next){
					next();
				};
			}).listen(server);

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
