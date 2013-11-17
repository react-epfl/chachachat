var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , messageSchema = require('./message').schema;

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

var Room = mongoose.model('Room', roomSchema);

module.exports = {
  schema: roomSchema,
  model: Room
};
