/**
 * Room model
 */

'use strict';

/******************************************************************************
 * Module dependencies
 */
var app; //all application-wide things like ENV, models, config, logger, etc
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var messageSchema = require('./message').schema;
var report = require('../reporter');
var _ = require('underscore');

exports.initModel = function (myApp, opts) {
  app = myApp;
};

/******************************************************************************
 * Schema
 */
var roomSchema = exports.Schema = new Schema({
  memberships: [{
    userId: {
      type: Schema.ObjectId,
      ref: 'User'
    },
    lastAccess: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [ messageSchema ],
  groupName: String // only needed when there are more than 2 members
});

/******************************************************************************
 * Statics
 */
roomSchema.statics = {
  messagesSince : function (userId, since, cb) {
    // mongoose will not automatically typecast arguments for aggregates
    if (typeof(since) === 'string') {
      since = new Date(since);
    }

    this.aggregate({
      $match: {
        'memberships.userId': userId
      }
    })
    .unwind('messages')
    .match({
      'messages.createdAt': {
        $gte: since
      }
    })
    .group({
      _id: '$_id',
      messages: {
        $push: '$messages'
      }
    })
    .exec(cb);
  },

  createRoom : function(userIds, cb) {
    var matches = userIds.map(function(userId) {
      return { "$elemMatch": { userId: ObjectId(userId) } }
    });

    mongoose.model('Room').find()
      .where('memberships').all(matches)
      .where('memberships').size(matches.length)
      .populate('memberships.userId')
      .exec(function(err, rooms) {
        if (err) {
          report.verbose('createRoom: error while searching for room: ' + err);
          return cb(err);

        } else if (rooms.length > 0) { // return existing room
          return cb(null, rooms[0]);

        } else { // return new room
          report.debug('createRoom: creating new room for users ' + userIds);
          var memberships = userIds.map(function(userId) {
            return { userId: userId };
          });

          var room = new app.Room({
            memberships: memberships,
          });

          room.save(function(err) {
            if (err) {
              return cb(err);
            } else {
              return cb(null, room);
            }
          });
        }
    });
  },

  roomsForUser : function(user, cb) {
    mongoose.model('Room').find()
      .where('memberships').elemMatch({
        userId: user.id
      })
      .populate('memberships.userId')
      .exec(cb);
  }
}

/******************************************************************************
 * Methods
 */
roomSchema.methods = {
  updateAccess: function(userId, cb) {
    app.Room.update({
      _id: this.id,
      'memberships.userId': userId
    }, {
      'memberships.$.lastAccess': new Date(0)
    }, cb);
  },

  addMessage: function(message, cb) {
    this.messages.push(message);

    this.save(function(err, room) {
      if (err) { return cb(err) };

      // update access times
      room.updateAccess(message.author, function(err) { if (err) report.error(err); });

      // update messages received and sent count
      room.memberships.forEach(function(membership) {
        var memberId = membership.userId;
        app.User.findById(memberId, function(err, user) {
          if (err) {
            return report.error(err);
          }

          if (room.messages.length === 1) { // the first message was published
            user.roomsCount += 1;
          }

          report.verbose('updating counts for member: ' + memberId);
          if (memberId.toString() === message.author.toString()) {
            user.msgSentCount += 1;
          } else {
            user.msgReceivedCount += 1;
            user.color = message.color;
          }

          var newPhrases = _.filter(message.content, function(phrase) {
            return phrase !== "";
          })

          user.phrases = _.union(user.phrases, newPhrases);

          user.save(function(err) { if (err) report.error(err); });
        });
      });

      // callback call as the last instruction, we don't really need to wait for previous fields to be updated
      cb();
    });
  },

  toJSON : function() {
    var roomMessages = this.messages.map(function(message) {
      message = new app.Message(message);
      return message.toJSON();
    })

    var roomJSON = {
      roomId: this._id,
      memberships: this.memberships,
      messages: roomMessages
    };

    if (this.groupName) {
      roomJSON.groupName = this.groupName;
    }

    return roomJSON;
  },

  populateMemberships : function(roomJSON, cb) {
    mongoose.model('Room')
      .findById(roomJSON.roomId.toString())
      .populate('memberships.userId')
      .exec(function(err, room) {

        if (err) {
          report.verbose('toJSON: error while searching for room: ' + err);
          return cb(err);
        }

        roomJSON.memberships = room.memberships;
        cb(null, roomJSON);
      });
  }
}
