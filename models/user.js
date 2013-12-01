var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , crypto = require('crypto');

var userSchema = new Schema({
  username: {
    type: String,
    unique: true
  },
  hashedPassword: String,
  salt: String,
  profile: {
  },
  phrases: [ String ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

userSchema.method('validatePassword', function(pw, cb) {
  return this.hashedPassword === crypto.pbkdf2Sync(pw, this.salt, 16384, 256).toString('base64');
});

userSchema.methods.publicData = function() {
  return {
    id: this._id,
    name: this.username
  };
}

userSchema.statics.findByUsername = function(username, cb) {
  this.findOne({ username: username }, cb);
};

userSchema.statics.whereNameContains = function(name, cb) {
  User.find({'username' : {$regex : '.*' + name + '*'}}, cb);
}

userSchema.statics.register = function(user, cb) {
  try {
    var salt = crypto.randomBytes(128).toString('base64');
    var hashedpw = crypto.pbkdf2Sync(user.password, salt, 16384, 256).toString('base64');

    var user = new User({
      username: user.username,
      salt: salt,
      hashedPassword: hashedpw
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
