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

var Room = mongoose.model('Room', roomSchema);

module.exports = {
  schema: roomSchema,
  model: Room
};
