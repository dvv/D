'use strict';

var Middleware = require('../lib');

//
// run cluster
//
var server = require('stereo')(null, {
	port: 3000,
	repl: true,
	workers: 1,
	watch: [__filename, 'app', 'lib', 'public'],
	ssl111: {
		key: 'key.pem',
		cert: 'cert.pem'
	}
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
		//Middleware.body(),

		// serve static stuff under ./public
		Middleware.static('/', __dirname + '/public', 'index.html', {
			//cacheMaxFileSizeToCache: 1024, // set to limit the size of cacheable file
		})

	));

	//
	// capability getter
	//
	var DNode = require('dnode');
	DNode(function(client, connection){
		this.authenticate = function(uid, password, next){
			Next({},
				function(err, result, step){
					var ok = user === 'root' && pass === '123';
					step(!ok);
				},
				function(err, user, step){
					if (err) return step(err);
					var caps = {
						foo: function(arg, next){
							next('RET: ' + arg);
						},
					};
				},
				function(err, context, step){
					connection.on('end', function(){
						process.log('User ', user, ' disconnected');
					});
					this.quote = function(cb){
						cb(Math.random());
					};
					merge(this, context);
					next(this);
				}
			);
		};
	}).listen(server);

//
// master process
//
} else {

	//
	// broadcast a message
	//
	setTimeout(function(){process.publish({sos: 'to all, all, all'});}, 2000);

}
