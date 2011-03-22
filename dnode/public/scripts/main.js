// configure RequireJS
require({
	priority: ['jquery']
});

// load scripts
require(['jquery', 'scripts/underscore.js', 'scripts/backbone.js', 'scripts/data.js'], function($){
	$(function(){
		// connect to the server
		var client = DNode({
			notify: function(msg, cb){
				console.log('calledbyserver!', msg);
				location.href = '#!/' + msg;
			}
		}).connect({
			reconnect: 5000, // FIXME: doesn't work
			secure: location.href.match(/^https:\/\//)
		}, function(remote){
			// obtain the user context
			remote.authenticate('root', '123', function(context){
				//console.log(window.ctx = Object.freeze(context));
				//$(document.body).append('<p>'+$('html').attr('class')+'</p>');
				//$(document.body).append('<p>'+JSON.stringify(context.caps)+'</p>');
				/*Traverse(context.caps).forEach(function(f){
					if (this.isLeaf && f && f.bind) {
						$(document.body).append('<p>'+this.path+'</p>');
					}
				});*/
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
