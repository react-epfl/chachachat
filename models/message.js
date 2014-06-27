/**
 * Message model
 */

'use strict';

/******************************************************************************
 * Module dependencies
 */
var app; //all application-wide things like ENV, models, config, logger, etc
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

exports.initModel = function (myApp, opts) {
  app = myApp;
};

/******************************************************************************
 * Schema
 */
var messageSchema = exports.Schema = new Schema({
  author: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  roomId: {
    type: Schema.ObjectId,
    ref: 'Room'
  },
  content: [ String ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  loc: {
    lat: Number,
    lng: Number
  },
  color: String
});

/******************************************************************************
 * Statics
 */
messageSchema.statics = {
  fromJSON : function(jsonMessage) {
    // will allow us to check fields before blindly saving the message to the database.
    var Message = mongoose.model('Message');
    return new Message(jsonMessage);
  }
}

/******************************************************************************
 * Methods
 */
messageSchema.methods = {
  toJSON : function() {
    return {
      messageId: this._id,
      roomId: this.roomId,
      author: this.author,
      content: this.content,
      createdAt: this.createdAt,
      loc: {
        lat: this.lat,
        lng: this.lng
      },
      color: this.color
    };
  }
}
