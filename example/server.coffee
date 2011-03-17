'use strict'

#
# coffee quirks
#
if process.argv[1].slice(-7) is '.coffee'
	process.argv[0] = 'coffee'
	require.paths.unshift __dirname + '/../node_modules'

#
# server helpers
#
Middleware = require '../lib'
Database = require '../lib/db'

#
# run cluster
#
config = require './config'
server = require('stereo') null, config.server

#
# worker process
#
if server

	#
	#
	#
	Next {},

		#
		# define DB model
		#
		(err, result, next) ->

			new Database config.database.url, require('./schema'), next

		#
		# define application
		#
		(err, exposed, next) ->

			model = exposed
			require('./app') config, model, next

		#
		# setup middleware
		#
		(err, app, next) ->

			server.on 'request', Middleware(

				# parse the body into req.body
				Middleware.body()

				# manage secure signed cookie which holds logged user id
				Middleware.session
					secret: 'your secret here'
					session_key: 'sid'
					#timeout: 24*60*60*1000

				# handle session auth
				Middleware.mount 'POST', '/auth', Middleware.authCookie app.checkCredentials

				# get user capability
				Middleware.capability app.getCapability

				# execute RPC
				Middleware.rest '/',
					jsonrpc: '2.0'
				#Middleware.RPC()

				# serve dynamic stuff under ./public
				# use to serve chrome page
				Middleware.templated
					map:
						'/': __dirname + '/public/index.html'

				# serve static stuff under ./public
				Middleware.static '/', __dirname + '/public', 'index.html',
					#cacheMaxFileSizeToCache: 1024 # set to limit the size of cacheable file
					#cacheTTL: 1000

				#Middleware.autBasic checkCredentials

			)

#
# master process
#
else

	# ???
