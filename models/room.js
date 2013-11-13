var mongoose = require('mongoose');
var messageSchema = require('./message').schema;

var roomSchema = mongoose.Schema({
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [ messageSchema ],
  lastAccess: {
    type: Date,
    default: Date.now
  }
});

var Room = mongoose.model('Room', roomSchema);

module.exports = {
  schema: roomSchema,
  model: Room
};
