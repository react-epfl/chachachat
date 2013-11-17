var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var messageSchema = new Schema({
  author: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  vocabulary: [ String ],
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

var Message = mongoose.model('Message', messageSchema);

module.exports = {
  schema: messageSchema,
  model: Message
};
