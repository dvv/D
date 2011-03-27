'use strict';

/*
 * TODO:
 * 1. just static/dynamic provider
 * 2. all stuff is via dnode
 */

var Middleware = require('../lib');

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
			new Middleware.Database(config.database.url, require('./schema'), next);
		},
		//
		// define application
		//
		function(err, exposed, next){
			if (err) {
				process.log(err.stack || err.message || err);
				process.exit(1);
			}
			this.model = exposed;
			require('./app')(config, this.model, next);
		},
		//
		// define ???
		//
		function(err, app, next){
			if (err) {
				process.log(err.stack || err.message || err);
				process.exit(1);
			}

			//
			// setup middleware
			//
			server.on('request', Middleware(

				// parse the body into req.body
				Middleware.body({
					/*onUploadProgress: function(file, state){
						//if (!(file.lastModifiedDate.getSeconds() % 2)) {
						if (state !== undefined || !((Date.now()/1000) % 2)) {
							process.log('PROGRESS', file);
						}
					}*/
				}),

				// manage secure signed cookie which holds logged user id
				Middleware.session(config.security.session, config.security.url),
				// handle session auth
				Middleware.mount('POST', config.security.url, Middleware.authCookie(app.checkCredentials)),

				// get user capability
				Middleware.capability(app.getCapability),

				// ReST
				Middleware.rest('/rest', {
					jsonrpc: '2.0',
					//putNew: '_new' // PUT /Foo/_new {data} creates new document
				}),

				// serve dynamic stuff under ./public
				// use to serve chrome page
				// FIXME: GET /index.html reveals templates!
				Middleware.templated({
					map: {
						'/': __dirname + '/templates/index.html',
						'/auth': __dirname + '/templates/auth.html'
					}
				}),

				// serve static stuff under ./public
				Middleware.static('/', __dirname + '/public', null, {
					//cacheMaxFileSizeToCache: 1024, // set to limit the size of cacheable file
				})

				// workaround since we are not connect/express ;)
				//
				// TODO: ping developers!
				//
				//require('dnode/lib/web.js').route('/dnode.js')

			));

			/***
			//
			// setup DNode
			//
			// TODO: https://github.com/substack/dnode-stack
			//
			var DNode = require('dnode');
			DNode(function(client, connection){

				// FIXME: vanilla exceptions due to _.rql()?
				connection.on('localError', function (err){
					//console.log('#############################' + err, arguments);
				});

				//process.log('CONN', connection.stream.socketio.request);
				// get user id
				var cookie = connection.stream.socketio.request &&
				Middleware.session.readSession(
					config.security.session.session_key || 'sid',
					config.security.session.secret,
					config.security.session.timeout || 24*60*60*1000,
					connection.stream.socketio.request
				);
				//process.log('COOOKIE', cookie);


				//
				// given user credentials, return user context
				//
				this.user = this.caps = {};
				//this.getCaps = function(next){
					Next(this,
						function(err, hz, step){
							app.getCapability(cookie && cookie.uid, step);
						},
						function(err, context, step){
							// strip secrets from user
							if (err) {
							} else {
								var user = context.user;
								delete context.user;
								this.user = {
									id: user.id,
									email: user.email,
									type: user.type
								};
							}
							step(err, context);
						},
						function(err, context, step){
							//process.log('CTX', err && err.stack, context);
							// bind handlers to the context
							context = _.traverse(context).map(function(f){
								if (typeof f === 'function' && f.bind) {
									return f.bind(null, context);
								} else {
									return f;
								}
							});
							// expose capabilities
							this.caps = context;
							//process.log('CTX!', context);
							//next(this);
						}
					);
				//};

				//this.getCaps = function(next){next(this);};

				this.broadcast = function(msg, next){
					next();
				};

			}).listen(server);
			***/

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
