var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
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
