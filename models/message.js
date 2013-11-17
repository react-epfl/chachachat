var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var messageSchema = new Schema({
  author: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  phrase: [ String ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  loc: {
    lat: Number,
    lng: Number
  }
});

var Message = mongoose.model('Message', messageSchema);

module.exports = {
  schema: messageSchema,
  model: Message
};
