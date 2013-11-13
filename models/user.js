var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  password: String,
  salt: String,
  profile: {
  },
  phrases: [ String ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.method('validatePassword', function(pw) {
  return this.password === pw;
});

userSchema.statics.findByUsername = function(username, cb) {
  this.findOne({ username: username }, cb);
};

var User = mongoose.model('User', userSchema);

module.exports = {
  schema: userSchema,
  model: User
}
