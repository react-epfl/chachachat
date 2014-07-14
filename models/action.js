/**
 * Action model
 */

'use strict';

/******************************************************************************
 * Module dependencies
 */
var app; //all application-wide things like ENV, models, config, logger, etc
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var report = require('../reporter');

exports.initModel = function (myApp, opts) {
  app = myApp;
};

/******************************************************************************
 * Schema
 */
var actionSchema = exports.Schema = new Schema({
  published: { type: Date, default: Date.now },
  actor: { // a user that sends a message
    type: Schema.ObjectId,
    ref: 'User'
  },
  verb: String,
  object: mongoose.Schema.Types.Mixed, // phrases or achievement
  target: { // a user that receives a message
    type: Schema.ObjectId,
    ref: 'User'
  }
});

/******************************************************************************
 * Statics
 */
actionSchema.statics = {
  create : function(actor, verb, object, target) {
    // TODO: a better way of doing this?
    var actionJSON = {
      actor: actor,
      verb: verb,
      object: object,
      target: target
    };

    var newAct = new app.Action(actionJSON);
    newAct.save(function (err, action) {
      if (err) return report('Error while logging action ' + err.message);
    });
  }
}

/******************************************************************************
 * Methods
 */
actionSchema.methods = {

}
