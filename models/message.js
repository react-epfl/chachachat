var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var messageSchema = new Schema({
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

messageSchema.methods.toJSON = function() {
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
};

messageSchema.statics.fromJSON = function(jsonMessage) {
  // will allow us to check fields before blindly saving the message to the database.
  var Message = mongoose.model('Message');
  return new Message(jsonMessage);
}

var Message = mongoose.model('Message', messageSchema);

module.exports = {
  schema: messageSchema,
  model: Message
};
