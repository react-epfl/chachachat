var mongoose = require('mongoose');
var crypto = require('crypto');
var async = require('async');
var _ = require('underscore');
var models = require('../models');
var Schema = mongoose.Schema;
var report = require('../reporter');
var achievementSchema = require('./achievement').schema;
var Dictionary = require('./dictionary').model;

var userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  hashedPassword: String,
  salt: String,
  email: {
    type: String
  },
  color: {type: String, default: '#E45E9D'},
  profile: {
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    age: {
      type: String,
      enum: ['teen', 'young', 'adult', 'mature', 'aged', 'senior']
    },
    stature: {
      type: String,
      enum: ['short', 'small', 'average', 'tall', 'gigantic']
    },
    physique: {
      type: String,
      enum: ['few extra kilos', 'molly', 'normal', 'fit', 'athletic']
    },
    allure: {
      type: String,
      enum: ['hideous', 'regular', 'elegant', 'beautiful', 'charismatic', 'stunning']
    },
    movies: {
      type: String,
      enum: [ '101 Dalmatians',
              'Avatar',
              'Ben-Hur',
              'Doctor Zhivago',
              'E. T. The Extra-Terrestrial',
              'Fantasia',
              'Finding Nemo',
              'Forrest Gump',
              'Gone With the Wind ',
              'Grease',
              'Harry Potter and the Deathly Hallows',
              'Iron Man 3',
              'Jaws',
              'Jurassic Park',
              'Marvel’s The Avengers',
              'Mary Poppins',
              'Pirates of the Caribbean',
              'Raiders of the Lost Ark',
              'Shrek 2',
              'Snow White and the Seven Dwarfs',
              'Spider-Man',
              'Star Wars: Episode IV',
              'The Dark Knight',
              'The Exorcist',
              'The Godfather',
              'The Graduate',
              'The Hunger Games',
              'The Lion King',
              'The Lord of the Rings',
              'The Sound of Music',
              'The Ten Commandments',
              'Titanic' ]
    },
    personality: {
      type: String,
      enum: [ 'adorable',
              'admirable',
              'amazing',
              'ambitious',
              'annoying',
              'big-hearted',
              'bitchy',
              'brilliant',
              'clean',
              'damaged',
              'unforgettable',
              'intellectual',
              'generous',
              'glamorous',
              'gifted',
              'gallant',
              'graceful',
              'happy',
              'horny',
              'old-fashioned',
              'pleasant',
              'real',
              'rusty',
              'special',
              'very romantic' ]
    },
    interests: {
      type: String,
      enum: [ 'a bit of TV',
              'books',
              'pretty things',
              'long walks on the beach',
              'cats',
              'dogs',
              'oral sex',
              'photography',
              'liberal ideas',
              'feminism',
              'beach stones',
              'ballroom dancing',
              'culture',
              'eating crisps',
              'going slowly',
              'one night stands',
              'nice sexy feet',
              'picnic',
              'sex',
              'smoking cigarettes',
              'new places',
              'well built men',
              'yoga' ]
    },
    lookingFor: {
      type: String,
      enum: [ 'a luna park',
              'a partner in crime',
              'adventure',
              'bondage',
              'cosy nights',
              'cuddling',
              'doing jigsaw puzzles',
              'drama',
              'fire-wood',
              'fulfillment',
              'good restaurants',
              'gym',
              'hot showers',
              'inner piece',
              'love',
              'massages',
              'meaning',
              'men',
              'new places',
              'rare coins',
              'riding zip lines',
              'the light at the end of the tunnel',
              'the time of my life',
              'thrills',
              'whip',
              'women' ]
    }
  },
  phrases: [ String ],
  msgReceivedCount: {
    type: Number,
    default: 0
  },
  msgSentCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  achievements: [ achievementSchema ]
});

userSchema.method('validatePassword', function(pw, cb) {
  return this.hashedPassword === crypto.pbkdf2Sync(pw, this.salt, 16384, 256).toString('base64');
});

userSchema.methods.publicData = function() {
  return {
    userId: this._id,
    name: this.username,
    profile: this.profile,
    msgSentCount: this.msgSentCount,
    msgReceivedCount: this.msgReceivedCount
  };
};

userSchema.methods.achievementForType = function(type) {
  for (var i = 0; i < this.achievements.length; ++i) {
    report.debug('looking at achievement ' + JSON.stringify(this.achievements[i]));

    if (this.achievements[i].type.toString() === type) {
      return this.achievements[i];
    }
  }

  return null;
};

// TODO: convert into an instance method
userSchema.statics.getProfileChars = function(userId, cb) {
  User.findById(userId, 'profile phrases', function (err, user) {
    if (err) return cb(err);

    var profileChars = [];

    var charNames = _.keys(User.schema.tree.profile);

    for (var i = 0; i < charNames.length; i++) {
      var charName = charNames[i];
      var charValues = User.schema.path('profile.' + charName).enumValues;
      var charSelected = user.profile[charName] || '';

      var profileChar = {'name': charName, 'values': charValues, 'selected': charSelected};
      profileChars.push(profileChar);
    }

    // initialise the user dictionary if it is empty
    if (!user.phrases || user.phrases.length === 0) {
      user.phrases = Dictionary.getRandomPhrases(10);
      return user.save(cb(err, profileChars));
    }

    cb(err, profileChars);
  })
};

// TODO: convert into an instance method
userSchema.statics.setProfileChars = function (userId, newChars, cb) {
  User.findById(userId, 'profile', function (err, user) {
    if (err) return cb(err);

    charsLength = newChars.length;
    for (var i = 0; i < charsLength; i++) {
      var curChar = newChars[i];

      if (curChar.selected) {
        user.profile[curChar.name] = curChar.selected;
      }
    }

    // TODO: error logging and handling
    user.save(cb);
  })
};

// TODO: convert into an instance method
userSchema.statics.getUserPhrases = function (userId, cb) {
// TODO: for some reason it is called even before the profileChars are set during registration
  User.findById(userId, function (err, user) {
    if (err) return cb(err);

    cb(null, user.phrases);
  });
};

// TODO: convert into an instance method
userSchema.statics.getProfileStats = function (userId, cb) {
  User.findById(userId, function (err, user) {
    if (err) return cb(err);

    var userProfile = [
      user.profile.gender,
      user.profile.age,
      user.profile.stature,
      user.profile.physique,
      user.profile.allure,
      user.profile.personality,
      user.profile.lookingFor
    ];
    var userDesc = userProfile.join(", ")

    var bestFriendName = 'Andrii';
    var stalkingName = 'Denis';
    var stalkedByName = 'Adrian';

    var userStats = [
      {name: 'Messages sent', value: user.msgSentCount.toString()},
      {name: 'Messages received', value: user.msgReceivedCount.toString()},
      {name: 'Number of phrases', value: user.phrases.length.toString()},

      {name: 'Best friend', value: bestFriendName},
      {name: 'Stalking', value: stalkingName},
      {name: 'Stalked by', value: stalkedByName},
      {name: 'color', value: user.color},

      {name: 'description', value: userDesc}
    ];

    cb(null, userStats);
  });
};

userSchema.statics.findByUsername = function(username, cb) {
  this.findOne({ username: username }, cb);
};

userSchema.statics.whereNameContains = function(name, cb) {
  report.verbose('looking for users whose name contains ' + name);
  User.find({'username' : new RegExp(name) }, cb);
}

userSchema.statics.register = function(reqUser, cb) {
  try {
    var salt = crypto.randomBytes(128).toString('base64');
    var hashedpw = crypto.pbkdf2Sync(reqUser.password, salt, 16384, 256).toString('base64');

    var user = new User({
      username: reqUser.username,
      salt: salt,
      hashedPassword: hashedpw,
    });

    var email = reqUser.email;
    if (email) user.email = email;

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
