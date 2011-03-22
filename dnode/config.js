'use strict';

module.exports = {
	server: {
		port: 3000,
		ssl1: {
			key: 'key.pem',
			cert: 'cert.pem'
		},
		shutdownTimeout: 10000,
		repl: true,
		pub: {
			dir: '../public',
			ttl: 3600
		},
		watch: ['*.js', 'public', '../lib'],
		stackTrace: true
	},
	security: {
		//bypass: true,
		session: {
			key: 'sid',
			secret: 'your secret here',
			timeout: 24*60*60*1000
		},
		root: {
			id: 'root',
			email: 'place-admin@here.com',
			password: '123',
			secret: '321',
			type: 'root'
		}
	},
	database: {
		url: ''
	},
	upload: {
		dir: 'upload'
	},
	defaults: {
		nls: 'en',
		currency: 'usd'
	}
};
