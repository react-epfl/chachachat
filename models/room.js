var mongoose = require('mongoose');
var messageSchema = require('./message').schema;

var roomSchema = mongoose.Schema({
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastAccess: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [ messageSchema ],
});

var Room = mongoose.model('Room', roomSchema);

module.exports = {
  schema: roomSchema,
  model: Room
};
