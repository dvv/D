(function() {
  'use strict';
  /*
   *
   * Simple database
   *
   * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
   * MIT Licensed
   *
  */  var Database, events, mongo, parseUrl;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  parseUrl = require('url').parse;
  mongo = require('mongodb');
  events = require('events');
  Database = (function() {
    __extends(Database, events.EventEmitter);
    function Database(options, definitions, callback) {
      var conn, host, name, port;
      if (options == null) {
        options = {};
      }
      conn = parseUrl(options.url || '');
      host = conn.hostname;
      if (conn.port) {
        port = +conn.port;
      }
      if (conn.auth) {
        this.auth = conn.auth;
      }
      if (conn.pathname) {
        name = conn.pathname.substring(1);
      }
      this.collections = {};
      this.cache = {};
      this.model = {};
      this.idFactory = function() {
        return (new mongo.BSONPure.ObjectID).toHexString();
      };
      this.attrInactive = options.attrInactive;
      this.cached = false;
      this.db = new mongo.Db(name || 'test', new mongo.Server(host || '127.0.0.1', port || 27017));
      if (definitions) {
        this.open(definitions, callback);
      }
    }
    Database.prototype.open = function(collections, callback) {
      var self;
      self = this;
      self.db.open(function(err, result) {
        var password, username, _ref;
        if (self.auth) {
          _ref = self.auth.split(':', 2), username = _ref[0], password = _ref[1];
          return self.db.authenticate(username, password, function(err, result) {
            if (err) {
              return typeof callback == "function" ? callback(err.message) : void 0;
            }
            self.register(collections, callback);
          });
        } else {
          if (err) {
            return typeof callback == "function" ? callback(err.message) : void 0;
          }
          return self.register(collections, callback);
        }
      });
    };
    Database.prototype.register = function(schema, callback) {
      var definition, len, name, self, _fn;
      self = this;
      len = _.size(schema);
      _fn = function(name) {
        self.db.collection(name, function(err, coll) {
          var k, store, v, _ref;
          self.collections[name] = coll;
          store = self.getModel(name, definition);
          if (definition != null ? definition.prototype : void 0) {
            _ref = definition.prototype;
            for (k in _ref) {
              if (!__hasProp.call(_ref, k)) continue;
              v = _ref[k];
              store[k] = _.isFunction(v) ? v.bind(store) : v;
            }
            delete definition.prototype;
          }
          Object.defineProperties(store, {
            id: {
              value: name
            },
            schema: {
              value: definition
            }
          });
          self.model[name] = store;
          if (--len <= 0) {
            return typeof callback == "function" ? callback(err != null ? err.message : void 0, self.model) : void 0;
          }
        });
      };
      for (name in schema) {
        definition = schema[name];
        _fn(name);
      }
    };
    Database.prototype.query = function(collection, schema, context, query, callback) {
      var doc, docs, self, _i, _len;
      query = _.rql(query);
      if (this.attrInactive) {
        query = query.ne(this.attrInactive, true);
      }
      if (this.cached) {
        self = this;
        if (self.cache[collection]) {
          docs = _.query(self.cache[collection], query);
          for (_i = 0, _len = docs.length; _i < _len; _i++) {
            doc = docs[_i];
            if (schema) {
              _.validate(doc, schema, {
                veto: true,
                removeAdditionalProps: !schema.additionalProperties,
                flavor: 'get'
              });
            }
          }
          if (typeof callback == "function") {
            callback(null, docs);
          }
        } else {
          this.collections[collection].find({}, {}, function(err, cursor) {
            if (err) {
              return typeof callback == "function" ? callback(err.message) : void 0;
            }
            return cursor.toArray(function(err, docs) {
              var doc, i, _i, _len, _len2;
              if (err) {
                return typeof callback == "function" ? callback(err.message) : void 0;
              }
              for (i = 0, _len = docs.length; i < _len; i++) {
                doc = docs[i];
                doc.id = doc._id;
                delete doc._id;
              }
              self.cache[collection] = docs.slice();
              docs = _.query(docs, query);
              for (_i = 0, _len2 = docs.length; _i < _len2; _i++) {
                doc = docs[_i];
                if (schema) {
                  _.validate(doc, schema, {
                    veto: true,
                    removeAdditionalProps: !schema.additionalProperties,
                    flavor: 'get'
                  });
                }
              }
              return typeof callback == "function" ? callback(null, docs) : void 0;
            });
          });
        }
      } else {
        query = query.toMongo();
        this.collections[collection].find(query.search, query.meta, function(err, cursor) {
          if (err) {
            return typeof callback == "function" ? callback(err.message) : void 0;
          }
          cursor.toArray(function(err, docs) {
            var doc, i, _len;
            if (err) {
              return typeof callback == "function" ? callback(err.message) : void 0;
            }
            for (i = 0, _len = docs.length; i < _len; i++) {
              doc = docs[i];
              doc.id = doc._id;
              delete doc._id;
              if (schema) {
                _.validate(doc, schema, {
                  veto: true,
                  removeAdditionalProps: !schema.additionalProperties,
                  flavor: 'get'
                });
              }
            }
            if (query.meta.values) {
              docs = _.map(docs, _.values);
            }
            if (typeof callback == "function") {
              callback(null, docs);
            }
          });
        });
      }
    };
    Database.prototype.get = function(collection, schema, context, id, callback) {
      var query;
      query = _.rql('limit(1)').eq('id', id);
      this.query(collection, schema, context, query, function(err, result) {
        if (callback) {
          if (err) {
            callback(err.message);
          } else {
            callback(null, result[0] || null);
          }
        }
      });
    };
    Database.prototype.owned = function(context, query) {
      var uid;
      uid = context && context.user && context.user.id;
      if (uid) {
        return _.rql(query).eq('_meta.history.0.who', uid);
      } else {
        return _.rql(query);
      }
    };
    Database.prototype.add = function(collection, schema, context, document, callback) {
      var self, uid;
      if (document == null) {
        document = {};
      }
      self = this;
      uid = context && context.user && context.user.id;
      Next(self, function(err, result, next) {
        if (schema) {
          _.validate.call(context, document, schema, {
            veto: true,
            removeAdditionalProps: !schema.additionalProperties,
            flavor: 'add',
            coerce: true
          }, next);
        } else {
          next(null, document);
        }
      }, function(err, document, next) {
        var parents, _ref, _ref2, _ref3;
        if (err) {
          return next(err);
        }
        document._id = document.id;
        delete document.id;
        parents = (context != null ? (_ref = context.user) != null ? (_ref2 = _ref._meta) != null ? (_ref3 = _ref2.history) != null ? _ref3[0].who : void 0 : void 0 : void 0 : void 0) || [];
        parents.unshift(uid);
        document._meta = {
          history: [
            {
              who: parents,
              when: Date.now()
            }
          ]
        };
        this.collections[collection].insert(document, {
          safe: true
        }, next);
      }, function(err, result, next) {
        var _ref;
        if (err) {
          if (((_ref = err.message) != null ? _ref.substring(0, 6) : void 0) === 'E11000') {
            err = [
              {
                property: 'id',
                message: 'duplicated'
              }
            ];
          }
          if (typeof callback == "function") {
            callback(err);
          }
        } else {
          result = result[0];
          result.id = result._id;
          delete result._id;
          if (schema) {
            _.validate(result, schema, {
              veto: true,
              removeAdditionalProps: !schema.additionalProperties,
              flavor: 'get'
            });
          }
          if (this.cached) {
            this.cache[collection] = null;
          }
          if (typeof callback == "function") {
            callback(null, result);
          }
        }
      });
    };
    Database.prototype.update = function(collection, schema, context, query, changes, callback) {
      var self, uid;
      if (changes == null) {
        changes = {};
      }
      self = this;
      uid = context && context.user && context.user.id;
      query = _.rql(query).toMongo();
      query.search.$atomic = 1;
      Next(self, function(err, result, next) {
        if (schema) {
          _.validate.call(context, changes, schema, {
            veto: true,
            removeAdditionalProps: !schema.additionalProperties,
            existingOnly: true,
            flavor: 'update',
            coerce: true
          }, next);
        } else {
          next(null, changes);
        }
      }, function(err, changes, next) {
        var history;
        if (err || !_.size(changes)) {
          return next(err);
        }
        history = {
          who: uid,
          when: Date.now()
        };
        delete changes._meta;
        history.what = changes;
        changes = {
          $set: changes
        };
        if (schema != null ? schema.saveChanges : void 0) {
          changes.$push = {
            '_meta.history': history
          };
        }
        this.collections[collection].update(query.search, changes, {
          multi: true
        }, next);
      }, function(err, result) {
        if (this.cached) {
          this.cache[collection] = null;
        }
        if (typeof callback == "function") {
          callback((err != null ? err.message : void 0) || err);
        }
      });
    };
    Database.prototype.remove = function(collection, context, query, callback) {
      var self, uid;
      self = this;
      uid = context && context.user && context.user.id;
      query = _.rql(query).toMongo();
      if (!_.size(query.search)) {
        return typeof callback == "function" ? callback('Refuse to remove all documents w/o conditions') : void 0;
      }
      this.collections[collection].remove(query.search, function(err) {
        if (this.cached) {
          this.cache[collection] = null;
        }
        if (typeof callback == "function") {
          callback(err != null ? err.message : void 0);
        }
      });
    };
    Database.prototype["delete"] = function(collection, context, query, callback) {
      var changes;
      if (this.attrInactive) {
        query = _.rql(query).ne(this.attrInactive, true).toMongo();
        changes = {};
        changes[this.attrInactive] = true;
        this.update(collection, null, context, query.search, changes, callback);
      } else {
        this.remove(collection, context, query, callback);
      }
    };
    Database.prototype.undelete = function(collection, context, query, callback) {
      var changes;
      if (this.attrInactive) {
        query = _.rql(query).eq(this.attrInactive, true).toMongo();
        changes = {};
        changes[this.attrInactive] = false;
        this.update(collection, null, context, query.search, changes, callback);
      } else {
        if (typeof callback == "function") {
          callback();
        }
      }
    };
    Database.prototype.purge = function(collection, context, query, callback) {
      if (this.attrInactive) {
        query = _.rql(query).eq(this.attrInactive, true);
        this.remove(collection, context, query, callback);
      } else {
        if (typeof callback == "function") {
          callback();
        }
      }
    };
    Database.prototype.getModel = function(entity, schema) {
      var db, store;
      db = this;
      store = {
        _query: db.query.bind(db, entity),
        _get: db.get.bind(db, entity),
        _add: db.add.bind(db, entity),
        _update: db.update.bind(db, entity),
        owned: db.owned,
        query: db.query.bind(db, entity, schema),
        get: db.get.bind(db, entity, schema),
        add: db.add.bind(db, entity, schema),
        update: db.update.bind(db, entity, schema),
        remove: db.remove.bind(db, entity)
      };
      if (this.attrInactive) {
        _.extend(store, {
          "delete": db["delete"].bind(db, entity),
          undelete: db.undelete.bind(db, entity),
          purge: db.purge.bind(db, entity)
        });
      }
      return store;
    };
    return Database;
  })();
  module.exports = Database;
}).call(this);
