var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , messageSchema = require('./message').schema
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
    if (err)
      return cb(err);

    room.updateAccess(message.author, cb);
  });
});

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

/*
roomSchema.statics.createRoom = function(userIds, cb) {
  var matches = userIds.map(function(userId) {
    return { "$elemMatch": { userId: userId } }
  });

  Room.find( { memberships: { $all: matches, $size: matches.length } },
    function(err, rooms) {
      if (err) {
        return cb(err);
      } else if (rooms) { // return existing room
        return cb(null, rooms[0]);
      } else { // return new room
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
    }
  );
};
*/

var Room = mongoose.model('Room', roomSchema);

module.exports = {
  schema: roomSchema,
  model: Room
};
