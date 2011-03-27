'use strict'

###
 *
 * Copyright(c) 2011 Vladimir Dronnikov <dronnikov@gmail.com>
 * MIT Licensed
 *
###

#
# base on underscore
#
global._ = require 'underscore'

#
# plugin bundle of RQL and Schema
#
require './underscore-data'

#
# expose
#
module.exports = require './database'
