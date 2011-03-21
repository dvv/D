'use strict';

var __slice = Array.prototype.slice, __hasProp = Object.prototype.hasOwnProperty;

module.exports = function(config, model, callback) {
	var FacetForAdmin, FacetForAffiliate, FacetForGuest, FacetForMerchant, FacetForReseller, FacetForRoot, FacetForUser, PermissiveFacet, User, app, facets, root;

	//
	// capability holder
	//
	facets = {};

	//
	// secrets helpers
	//
	var Crypto = require('crypto');
	function nonce() {
		return (Date.now() & 0x7fff).toString(36) + Math.floor(Math.random() * 1e9).toString(36) + Math.floor(Math.random() * 1e9).toString(36) + Math.floor(Math.random() * 1e9).toString(36);
	};
	function sha1(data, key) {
		var hmac;
		hmac = Crypto.createHmac('sha1', '');
		hmac.update(data);
		return hmac.digest('hex');
	};
	function encryptPassword(password, salt) {
		return sha1(salt + password + config.security.secret);
	};

	//
	// secure root account
	//
	var root = config.security.root || {};
	root.salt = nonce();
	root.password = encryptPassword(root.password, root.salt);

	//
	// redefine User accessors, to obey security
	//
	User = model.User;
	model.User = {
		//
		// get -- special cases are:
		// 1. getting the root, because it's not in DB
		// 2. getting the context.user, because we must use another schema
		//
		get: function(context, id, next) {
			var isSelf, profile, user, _ref;
			if (!id) return next();
			isSelf = id === (context != null ? (_ref = context.user) != null ? _ref.id : void 0 : void 0);
			if (root.id === id) {
				user = root;
				profile = _.extend({}, {
					id: user.id,
					type: user.type,
					email: user.email
				});
				next(null, profile);
			} else {
				if (isSelf) {
					User._get(model.UserSelf.schema, context, id, next);
				} else {
					User.get(context, id, next);
				}
			}
		},
		// query goes intact
		query: function(context, query, next) {
			User.query(context, query, next);
		},
		//
		// add -- forbid clashing with root's name; assign crypted password and salt
		//
		add: function(context, data, next) {
			if (data == null) data = {};
			Next(context,
			function(err, result, step) {
				step(null, (root.id === data.id ? root : null));
			},
			function(err, user, step) {
				var password, salt;
				if (err) return step(err);
				if (user) return step([{property: 'id', message: 'duplicated'}]);
				salt = nonce();
				if (!data.password) {
					data.password = nonce().substring(0, 7);
				}
				password = encryptPassword(data.password, salt);
				User.add(context, {
					id: data.id,
					password: password,
					salt: salt,
					type: data.type
				}, step);
			},
			function(err, user) {
				if (err) return next(err);
				if (user.email) {
					console.log('PASSWORD SET TO', data.password);
				}
				next(null, user);
			});
		},
		//
		// update -- act differently upon context.user (because of schema);
		// also take care of updating salt and crypted password
		//
		update: function(context, query, changes, next) {
			var plainPassword = void 0;
			Next(context,
			// update self
			function(err, result, step) {
				var profileChanges;
				profileChanges = _.clone(changes);
				if (profileChanges.password) {
					plainPassword = String(profileChanges.password);
					profileChanges.salt = nonce();
					profileChanges.password = encryptPassword(plainPassword, profileChanges.salt);
				}
				User._update(model.UserSelf.schema, context, _.rql(query).eq('id', context.user.id), profileChanges, step);
				/*
									if plainPassword and @user.email
										console.log 'PASSWORD SET TO', plainPassword
										#	mail context.user.email, 'Password set', plainPassword
									*/
			},
			// update others
			function(err, result, step) {
				User.update(context, _.rql(query).ne('id', context.user.id), changes, step);
			},
			function(err) {
				next(err);
			});
		},
		//
		// remove -- forbid self-removal
		//
		remove: function(context, query, next) {
			User.remove(context, _.rql(query).ne('id', context.user.id), next);
		},
		//
		// delete -- forbid self-removal
		//
		delete: function(context, query, next) {
			User.delete(context, _.rql(query).ne('id', context.user.id), next);
		},
		//
		// undelete -- forbid self-restoral
		//
		undelete: function(context, query, next) {
			User.undelete(context, _.rql(query).ne('id', context.user.id), next);
		},
		//
		// purge -- forbid self-purge
		//
		purge: function(context, query, next) {
			User.purge(context, _.rql(query).ne('id', context.user.id), next);
		},
		verify: function(uid, password, next) {
			Next(null,
			function(err, result, step) {
				model.User.getContext(uid, step);
			},
			function(err, context) {
				var user = context.user;
				if (!user.id) {
					if (uid) {
						next('Invalid user');
					} else {
						next();
					}
				} else {
					if (!user.password || user.blocked) {
						next('Invalid user');
					} else if (user.password === encryptPassword(password, user.salt)) {
						next();
					} else {
						next('Invalid user');
					}
				}
			});
		},

		//
		// get capability of the current user
		//
		getContext: function(uid, next) {
			Next(null,
			function(err, result, step) {
				// root is special
				if (root.id === uid) {
					step(null, _.clone(root));
				} else {
					User._get(null, this, uid, step);
				}
			},
			function(err, user, step) {
				// get the user level
				var context, level;
				if (user == null) user = {};
				// only root can access disabled server
				if (config.server.disabled && root.id !== user.id) {
					level = 'none';
				// check if security may be bypassed
				} else if (config.security.bypass || root.id === user.id) {
					level = 'root';
				// explicit user.type == array of roles
				} else if (user.id && user.type) {
					level = user.type;
				// authenticated? -> 'user' level
				} else if (user.id) {
					level = 'user';
				// guest? -> 'public' level
				} else {
					level = 'public';
				}
				// map roles to facets
				if (!_.isArray(level)) level = [level];
				// context is a collection of facets
				context = _.extend.apply(null, [{}].concat(level.map(function(x) {
					return facets[x];
				})));
				// set context.user
				Object.defineProperty(context, 'user', {
					value: user
				});
				next(null, context);
			});
		}
	};

	//
	// User types: redefine conditions to constrain queries to a certain user type
	//
	_.each({
		affiliate: 'Affiliate',
		admin: 'Admin'
	}, function(name, type) {
		// N.B. we constrain accessors to act upon only owned objects of certain type
		model[name] = {
			query: function(context, query, next) {
				model.User.query(context, User.owned(context, query).eq('type', type), next);
			},
			get: function(context, id, next) {
				var query = User.owned(context, 'limit(1)').eq('type', type).eq('id', id);
				model.User.query(context, query, function(err, result) {
					next(err, result[0] || null);
				});
			},
			add: function(context, data, next) {
				if (data == null) data = {};
				data.type = type;
				model.User.add(context, data, next);
			},
			update: function(context, query, changes, next) {
				model.User.update(context, User.owned(context, query).eq('type', type), changes, next);
			},
			remove: function(context, query, next) {
				model.User.remove(context, User.owned(context, query).eq('type', type), next);
			},
			delete: function(context, query, next) {
				model.User.delete(context, User.owned(context, query).eq('type', type), next);
			},
			undelete: function(context, query, next) {
				model.User.undelete(context, User.owned(context, query).eq('type', type), next);
			},
			purge: function(context, query, next) {
				model.User.purge(context, User.owned(context, query).eq('type', type), next);
			}
		};
		// TODO: reuse Database.register logic
		Object.defineProperties(model[name], {
			id: {
				value: name
			},
			schema: {
				value: User.schema
			}
		});
	});

	//
	// Geo special methods
	//
	model.Geo.fetch = function(context, callback) {
		context.Geo.remove(context, 'a!=b', function() {
			_.each(require('geoip')().countries, function(rec) {
				if (rec.iso3.length < 3) {
					return;
				}
				context.Geo.add(context, rec, function(err, result) {
					if (err) {
						console.log('GEOFAILED', rec.name, err);
					}
				});
			});
			callback();
		});
	};

	//
	// Currency special methods
	//
	model.Currency.getDefault = function(context, callback) {
		context.Currency.query(context, 'default=true', function(err, result) {
			callback(err, result && result[0]);
		});
	};
	model.Currency.setDefault = function(context, data, callback) {
		if (data == null) data = {};
		context.Currency.update(context, void 0, {
			"default": false
		}, function(err, result) {
			if (err) return callback(err);
			context.Currency.update(context, [data.id], {
				"default": true,
				active: true
			}, callback);
		});
	};
	model.Currency.fetch = function(context, callback) {
		Next({}, function(err, result, next) {
			context.Currency.getDefault(context, next);
		}, function(err, defaultCurrency, next) {
			require('./currency').fetchExchangeRates(defaultCurrency, next);
		}, function(err, courses, next) {
			var date = Date.now();
			_.each(courses, function(rec) {
				if (_.isEmpty(rec.value)) {
					rec.value = void 0;
				} else {
					rec.value = _.reduce(rec.value, (function(s, y) {
						return s += y;
					}), 0) / _.size(rec.value);
				}
				rec.date = date;
				context.Currency.add(context, rec, function(err, result) {
					var _ref;
					if ((err != null ? (_ref = err[0]) != null ? _ref.message : void 0 : void 0) === 'duplicated') {
						context.Currency.update(context, [rec.id], rec, function(err, result) {});
					} else if (err) {
						if (err) {
							console.log('CURFAILED2', rec.name, err);
						}
					}
				});
			});
			callback();
		});
	};

	//
	// facet helpers
	//

	PermissiveFacet = function() {
		var expose, obj, plus;
		obj = arguments[0], plus = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
		expose = ['schema', 'id', 'query', 'get', 'add', 'update', 'remove', 'delete', 'undelete', 'purge'];
		if (plus.length) {
			expose = expose.concat(plus);
		}
		return _.proxy(obj, expose);
	};


	//
	// facets
	//

	// public
	FacetForGuest = _.freeze(_.extend({}, {
		getRoot: function(context, query, next) {
			var k, s, user, v;
			s = {};
			for (k in context) {
				if (!__hasProp.call(context, k)) continue;
				v = context[k];
				if (typeof v === 'function') {
					s[k] = true;
				} else if (v.schema) {
					s[k] = {
						schema: v.schema,
						methods: _.functions(v)
					};
				}
			}
			user = context.user;
			next(null, {
				user: {
					id: user.id,
					email: user.email,
					type: user.type
				},
				schema: s
			});
		}
	}));

	// authenticated user
	FacetForUser = _.freeze(_.extend({}, FacetForGuest, {
		profile: {
			query: model.User.getProfile,
			update: model.User.setProfile
		}
	}));

	// DB owner
	FacetForRoot = _.freeze(_.extend({}, FacetForUser, {
		Affiliate: PermissiveFacet(model.Affiliate),
		Admin: PermissiveFacet(model.Admin),
		Role: PermissiveFacet(model.Role),
		Group: PermissiveFacet(model.Group),
		Language: PermissiveFacet(model.Language),
		Currency: PermissiveFacet(model.Currency, 'fetch', 'setDefault'),
		Geo: PermissiveFacet(model.Geo, 'fetch')
	}));

	// affiliate
	FacetForAffiliate = _.freeze(_.extend({}, FacetForUser, {}));
	FacetForReseller = _.freeze(_.extend({}, FacetForAffiliate, {
		Affiliate: FacetForRoot.Affiliate
	}));

	// merchant
	FacetForMerchant = _.freeze(_.extend({}, FacetForUser, {}));

	// admin
	FacetForAdmin = _.freeze(_.extend({}, FacetForUser, {
		Affiliate: FacetForRoot.Affiliate,
		Admin: FacetForRoot.Admin,
		Role: FacetForRoot.Role,
		Group: FacetForRoot.Group,
		Language: FacetForRoot.Language,
		Currency: FacetForRoot.Currency,
		Geo: FacetForRoot.Geo
	}));
	facets.public = FacetForGuest;
	facets.user = FacetForUser;
	facets.root = FacetForRoot;
	facets.affiliate = FacetForAffiliate;
	facets.merchant = FacetForMerchant;
	facets.admin = FacetForAdmin;

	//
	// application
	//

	app = {
		getCapability: model.User.getContext,
		checkCredentials: model.User.verify
	};
	callback(null, app);

};
