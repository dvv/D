// configure RequireJS
require({
	priority: ['jquery', 'underscore', 'backbone', 'data']
});

// load scripts
require(['jquery', 'underscore', 'backbone', 'data'], function($){
	$(function(){
		var client = DNode({
			notify: function(msg, cb){
				console.log('calledbyserver!', msg);
				location.href = '#!/' + msg;
			}
		}).connect({
			reconnect: 5000
		}, function(remote){
			remote.authenticate('root', '1231', function(context){
				console.log(window.ctx = context);
			});
		});
		// FIXME: doesn't work ;(
		/*
		client.on('localError', function(err){
			console.log('Local Error: ' + err);
		});
		client.on('remoteError', function(err){
			console.log('Remote Error: ' + err);
		});*/
	});
});
