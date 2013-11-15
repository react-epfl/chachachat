var mongoose = require('mongoose');
var crypto = require('crypto');

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

userSchema.method('validatePassword', function(pw, cb) {
  return this.password === crypto.pbkdf2Sync(pw, this.salt, 16384, 256).toString('base64');
});

userSchema.statics.findByUsername = function(username, cb) {
  this.findOne({ username: username }, cb);
};

userSchema.statics.register = function(user, cb) {
  try {
    var salt = crypto.randomBytes(128).toString('base64');
    var hashedpw = crypto.pbkdf2Sync(user.password, salt, 16384, 256).toString('base64');

    var user = new User({
      username: user.username,
      salt: salt,
      password: hashedpw
    });

    user.save(cb);
  } catch (err) {
    // crypto function can throw an exception
    cb(err);
  }
};

var User = mongoose.model('User', userSchema);

module.exports = {
  schema: userSchema,
  model: User
}
