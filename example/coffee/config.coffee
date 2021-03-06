'use strict'

module.exports =

	server:

		port: 3000
		#workers: require('os').cpus().length
		shutdownTimeout: 10000
		#uid: 65534
		#gid: 65534
		#pwd: './secured-root'
		#ssl:
		#	key: '../key.pem'
		#	cert: '../cert.pem'
		repl: true
		pub:
			dir: '../public'
			ttl: 3600
		watch: ['../lib']
		stackTrace: true

	security:

		bypass: true
		secret: 'change-me-on-production-server'
		root:
			id: 'root'
			email: 'place-admin@here.com'
			password: '123'
			secret: '321'
			type: 'root'

	database:

		url: '' #'mongodb://127.0.0.1/simple'
		#attrInactive: '_deleted'

	upload:

		dir: 'upload'

	defaults:

		nls: 'en'
		currency: 'usd'
