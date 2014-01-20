var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId
  , messageSchema = require('./message').schema
  , User = require('./user').model
  , report = require('../reporter');

var roomSchema = new Schema({
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

roomSchema.method('updateAccess', function(userId, cb) {
  Room.update({
    _id: this.id,
    'memberships.userId': userId
  }, {
    'memberships.$.lastAccess': new Date(0)
  }, cb);
});

roomSchema.method('addMessage', function(message, cb) {
  var room = this;

  room.update({
    $push: { messages: message }
  }, function(err) {
    if (err) {
      return cb(err);
    }

    // update access times
    room.updateAccess(message.author, function(err) { if (err) report.error(err); });

    // update messages received and sent count
    room.memberships.forEach(function(membership) {
      var memberId = membership.userId;
      User.findById(memberId, function(err, user) {
        if (err) {
          return report.error(err);
        }

        report.verbose('updating counts for member: ' + memberId);

        if (memberId.toString() === message.author.toString()) {
          user.msgSentCount += 1;
        } else {
          user.msgReceivedCount += 1;
        }

        user.save(function(err) { if (err) report.error(err); });
      });
    });

    // callback call as the last instruction, we don't really need to wait for previous fields to be updated
    cb();
  });
});

roomSchema.methods.toJSON = function() {
  var json = {
    roomId: this._id,
    memberships: this.memberships,
    messages: this.messages.map(function(message) { return message.toJSON(); })
  };

  if (this.groupName) {
    json.groupName = this.groupName;
  }

  return json;
};

roomSchema.statics.messagesSince = function (userId, since, cb) {
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
};

roomSchema.statics.createRoom = function(userIds, cb) {
  var matches = userIds.map(function(userId) {
    return { "$elemMatch": { userId: ObjectId(userId) } }
  });

  mongoose.model('Room').find()
    .where('memberships').all(matches)
    .where('memberships').size(matches.length)
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

        var room = new Room({
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
};

roomSchema.statics.roomsForUser = function(user, cb) {
  mongoose.model('Room').find()
    .where('memberships').elemMatch({
      userId: user.id
    })
    .exec(cb);
};

var Room = mongoose.model('Room', roomSchema);

module.exports = {
  schema: roomSchema,
  model: Room
};
