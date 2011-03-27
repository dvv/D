all: index.js test

index.js: src/object.coffee src/rql.coffee src/schema.coffee
	@mkdir -p lib
	@coffee -jcp $^ >lib/underscore-data.js
	@coffee -c -o lib src/database.coffee src/index.coffee

tmp/paperboy.js:
	@mkdir -p tmp
	@wget --no-check-certificate https://github.com/felixge/node-paperboy/raw/master/lib/paperboy.js -O $@

test: index.js tmp/paperboy.js
	@echo "var path=require('path');var paperboy=require('./tmp/paperboy.js');require('http').createServer(function(req, res){paperboy.deliver(path.join(__dirname,'/test'),req,res)}).listen(8080);console.log('Point your browser to http://localhost:8080');" | node

.PHONY: all test
