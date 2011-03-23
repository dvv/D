'use strict';

// configure RequireJS
require({
	priority: ['jquery']
});

// load scripts
require(['jquery', 'scripts/underscore.js', 'scripts/backbone.js', 'scripts/data.js'], function($){

	//
	// helpers
	//
	_.mixin({
		partial: function(templateIds, data){
			if (!_.isArray(templateIds)) {
				templateIds = [templateIds, 'notfound'];
			}
			var text = null;
			_.each(templateIds, function(tid){
				//console.log('PART?', tid);
				var t = $('#tmpl-'+tid);
				if (t && !text) {
					text = t.text();
					//console.log('PART!', text);
				}
			});
			return text ? _.template(text, data) : '';
		}
	});

	//
	// chrome model
	//
	var Chrome = Backbone.Model.extend({
		initialize: function(){
			this.bind('change:error', function(model, value){
				console.log('ERRRR', value);
			});
			this.bind('change:entity', function(model, value){
				console.log('ENTITY', value);
			});
			this.bind('change:data', function(model, value){
				console.log('DATA', value);
				//$(document.body).append(JSON.stringify(model.toJSON()));
			});
			this.bind('change:user', function(model, value){
				console.log('USER', value);
				$('#user').html(_.partial('user', value));
			});
			this.bind('change:caps', function(model, value){
				console.log('CAPS', value);
				var entities = _.reduce(value, function(acc, v, k){
					if (v && v.query) acc[k] = v;
					return acc;
				}, {});
				$('#menu').html(_.partial('menu', entities));
			});
		}
	});

	//
	// views
	//
	var FooterApp = Backbone.View.extend({
		el: $('#footer'),
		render: function(){
			this.el.html(_.partial('footer', {
				// 4-digit year as string -- to be used in copyright (c) 2010-XXXX
				year: (new Date()).toISOString().substring(0, 4)
			}));
			return this;
		},
		initialize: function(){
			_.bindAll(this, 'render');
			model.bind('change', this.render);
		}
	});

	//
	// controller
	//
	var Controller = Backbone.Controller.extend({
		initialize: function(config){
			var ctx = config.caps;
			console.log('INIT', ctx);
			/*Traverse(config.caps).forEach(function(node){
				if (this.isLeaf && node && node.bind && !node.match) {
					console.log('PATH', this.path.join('/'));
				}
			});*/
			//
			// operate on entities: #list/<Entity>[?querystring]
			//
			var entities = _.reduce(ctx, function(acc, x, k){
				if (x && x.query) {
					acc.push(k);
				}
				return acc;
			}, []);
			console.log('QUERIES', entities);
			this.route(new RegExp('^list/(' + entities.join('|') + ')(?:\?(.*))?$'), 'list', function(entity, query){
				query = query ? query.substring(1) : '';
				console.log('ROUTE: list', entity, query);
				/*ctx[entity].query(query, function(err, result){
					if (err) {
						model.set({error: err, entity: entity, query: query, data: undefined});
					} else {
						model.set({error: undefined, entity: entity, query: query, data: result});
					}
				});*/
				var m = new Backbone.Collection();
				m.url = entity + '?' + query;
				m.fetch({
					error: function(coll, xhr){
						//console.log('MOD', xhr);
						model.set({error: xhr.responseText, entity: entity, query: query, data: undefined});
					},
					success: function(coll, response){
						//console.log('MOD', arguments);
						model.set({error: response.error, entity: entity, query: query, data: response.result});
					}
				});
			});
			//console.log('ROUTES', list, this.routes);
		},
		routes: {
			'help':										'help',    // #help
			'search/:query':					'search',  // #search/kiwis
		},
		help: function(){
			console.log('HELP');
		},
		search: function(query){
			console.log('SEARCH:', query);
		},
		admin: function(){
			console.log('ADMIN:');
		},
	});

	//
	// DOM is ready
	//
	$(function(){

		//
		// connect to the server
		//
		DNode({
			// catch server-side errors
			error: function(err, cb){
				model.set({err: err});
				cb();
			},
			// server notifies
			notify: function(msg, cb){
				console.log('calledbyserver!', msg);
				location.href = '#!/' + msg;
			}
		}).connect({
			reconnect: 5000, // FIXME: doesn't work?
			secure: location.href.match(/^https:\/\//)
		}, function(remote){
			// create chrome model
			window.model = new Chrome({
				user: remote.user,
				caps: remote.caps
			});
			model.trigger('change:user', model, remote.user);
			model.trigger('change:caps', model, remote.caps);
			// create controller
			new Controller({caps: remote.caps});
			// let the history begin
			Backbone.history.start();
		});

	});
});
