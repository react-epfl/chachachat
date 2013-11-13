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

var User = mongoose.model('users', userSchema);

module.exports = {
  schema: userSchema,
  model: User
}
