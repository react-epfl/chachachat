/**
 * User model
 */

'use strict';

var app; //all application-wide things like ENV, models, config, logger, etc
var mongoose = require('mongoose');
var crypto = require('crypto');
var async = require('async');
var _ = require('underscore');
var Schema = mongoose.Schema;
var report = require('../reporter');
var achievementSchema = require('./achievement').schema;
var Dictionary = require('./dictionary').model;

exports.initModel = function (myApp, opts) {
  app = myApp;
};

/******************************************************************************
 * Schema
 */
var userSchema = exports.Schema = new Schema({
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
  token: String,
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
  roomsCount: {
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

/******************************************************************************
 * Hooks
 */
  // TODO: should be an instance method
  var socketsForUser = function(user) {
    report.debug('getting sockets from ' + user._id.toString());

    return app.io.sockets.clients().filter(function(socket) {
      var socketId = socket.handshake.user._id.toString();
      var userId = user._id.toString();

      var matches = socketId === userId;

      if (matches) {
        report.debug('socket ' + socketId + ' belongs to ' + userId);
      } else {
        report.debug('socket ' + socketId + ' does not belong to ' + userId);
      }

      return matches;
    });
  };


/* triggers for # sent achievement */
userSchema.post('save', function(user) {
  var achName = 'Big Mouth';
  var sentAchLevels = [1, 10, 50, 100, 300, 1000, 5000];
  var curValue = user.msgSentCount;

  report.debug('a user was saved: ' + user._id);

  app.Achievement.checkAndNotify(user, achName, sentAchLevels, curValue, function(newAchievementObj) {
    socketsForUser(user).forEach(function(socket) {
      socket.emit('newAchievement', newAchievementObj);
    });
  });
});

/* triggers for # received achievement */
userSchema.post('save', function(user, maybe, third) {
  var achName = 'Talk To Me';
  var receivedAchievementLevels = [1, 10, 50, 100, 300, 1000, 5000];
  var curValue = user.msgReceivedCount;

  app.Achievement.checkAndNotify(user, achName, receivedAchievementLevels, curValue, function(newAchievementObj) {
    socketsForUser(user).forEach(function(socket) {
      socket.emit('newAchievement', newAchievementObj);
    });
  });
});

/* triggers for # of rooms/friends */
userSchema.post('save', function(user, maybe, third) {
  var achName = 'Cool Kid';
  var receivedAchievementLevels = [1, 10, 50, 100, 300, 1000, 5000];
  var curValue = user.roomsCount;

  app.Achievement.checkAndNotify(user, achName, receivedAchievementLevels, curValue, function(newAchievementObj) {
    socketsForUser(user).forEach(function(socket) {
      socket.emit('newAchievement', newAchievementObj);
    });
  });
});

/* triggers for # phrases */
userSchema.post('save', function(user, maybe, third) {
  if (!user.phrases) return; // a dirty hack when phrases are not defined

  var achName = 'Me Speak Good';
  var phrasesAchievementSteps = [20, 30, 50, 100, 300, 1000, 5000];
  var curValue = user.phrases.length;

  app.Achievement.checkAndNotify(user, achName, phrasesAchievementSteps, curValue, function(newAchievementObj) {
    socketsForUser(user).forEach(function(socket) {
      socket.emit('newAchievement', newAchievementObj);
    });
  });
});

// TODO: hooks should be moved into the User model
// TODO: maybe we should not use hooks since this code is executed on every user change
/* triggers for # phrases recieved from different countries */
userSchema.post('save', function(user, maybe, third) {
  var achName = 'Globetrotter';
  var receivedAchievementSteps = [1, 10, 50, 100, 300, 1000, 5000];

  // TODO: think how to actually implement it
  // app.Achievement.checkAndNotify(user, achName, sentAchLevels, curValue);
});

/* triggers for # phrases sent to different countries */
userSchema.post('save', function(user, maybe, third) {
  var achName = 'Pony Express';
  var receivedAchievementSteps = [1, 10, 50, 100, 300, 1000, 5000];

  // TODO: think how to actually implement it
  // app.Achievement.checkAndNotify(user, achName, sentAchLevels, curValue);
});

/******************************************************************************
 * Statics
 */
userSchema.statics = {

  // TODO: we should already have the user loaded at this point
  setDeviceToken : function(userId, deviceToken, cb) {
    app.User.findById(userId, 'tokens', function (err, user) {
      if (err) return cb(err);
      if (deviceToken === '(null)') return cb(); // don't store '(null)' deviceToken by emulator

      // we will keep only one latest device token for a user
      // TODO: support multiple devices of a user, should notify all of them
      // should store mapping <device_id, token_id> and for each device keep the latest token
      user.token = deviceToken;
      user.save(cb);
    });
  },


  // TODO: convert into an instance method
  getProfileChars : function(userId, cb) {
    app.User.findById(userId, 'profile phrases', function (err, user) {
      if (err) return cb(err);

      var profileChars = [];

      var charNames = _.keys(app.User.schema.tree.profile);

      for (var i = 0; i < charNames.length; i++) {
        var charName = charNames[i];
        var charValues = app.User.schema.path('profile.' + charName).enumValues;
        var charSelected = user.profile[charName] || '';

        var profileChar = {'name': charName, 'values': charValues, 'selected': charSelected};
        profileChars.push(profileChar);
      }

      // initialise the user dictionary if it is empty
      if (!user.phrases || user.phrases.length === 0) {
        user.phrases = app.Dictionary.getRandomPhrases(10);
        return user.save(cb(err, profileChars));
      }

      cb(err, profileChars);
    })
  },

  // TODO: convert into an instance method
  setProfileChars : function (userId, newChars, cb) {
    app.User.findById(userId, 'profile', function (err, user) {
      if (err) return cb(err);

      var charsLength = newChars.length;
      for (var i = 0; i < charsLength; i++) {
        var curChar = newChars[i];

        if (curChar.selected) {
          user.profile[curChar.name] = curChar.selected;
        }
      }

      // TODO: error logging and handling
      user.save(cb);
    })
  },

  // TODO: convert into an instance method
  getUserPhrases : function (userId, cb) {
  // TODO: for some reason it is called even before the profileChars are set during registration
    app.User.findById(userId, function (err, user) {
      if (err) return cb(err);

      cb(err, user.phrases);
    });
  },

  // TODO: convert into an instance method
  getUserAchievements : function (userId, cb) {
  // TODO: for some reason it is called even before the profileChars are set during registration
    app.User.findById(userId, function (err, user) {
      if (err) return cb(err);

      // TODO: should be in the db independantly for each achievement type
      var achLevels = [1, 10, 50, 100, 300, 1000, 5000];

      var userAchievements = [];
      var name, desc, level, value, untilNext;

      // TODO: probably we should not use an array but a hash for the achievements
      _.each(user.achievements, function(achievement) {
        name = achievement.name;
        level = achievement.level;
        desc = achievement.desc;

        switch(achievement.name) {
          case 'Big Mouth':
            value = user.msgSentCount;
          break;

          case 'Talk To Me':
            value = user.msgReceivedCount;
          break;

          case 'Cool Kid':
            value = user.roomsCount;
          break;

          case 'Me Speak Good':
            achLevels = [20, 30, 50, 100, 300, 1000, 5000];;
            value = user.phrases.length;
          break;
        }

        untilNext = achLevels[level] - value;

        userAchievements.push({
          name: name,
          level: level,
          value: value,
          desc: desc,
          untilNext: untilNext
        })
      })

      cb(err, userAchievements);
    });
  },

  // TODO: convert into an instance method
  getProfileStats : function (userId, cb) {
    app.User.findById(userId, function (err, user) {
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
        {name: 'Messages sent', value: user.msgSentCount},
        {name: 'Messages received', value: user.msgReceivedCount},
        {name: 'Number of phrases', value: user.phrases.length},

        // TODO: put back when the logic is ready
        // {name: 'Best friend', value: bestFriendName},
        // {name: 'Stalking', value: stalkingName},
        // {name: 'Stalked by', value: stalkedByName},
        {name: 'color', value: user.color},

        {name: 'description', value: userDesc}
      ];

      cb(null, userStats);
    });
  },

  findByUsername : function(username, cb) {
    this.findOne({ username: username }, cb);
  },

  findByProfile : function (chars, cb) {
    var searchObj = {};

    _.each(chars, function(charact) {
      var fieldName = 'profile.' + charact.name;
      var fieldValue = charact.selected;

      searchObj[fieldName] = fieldValue;
    });

    this.find(searchObj)
        .limit(20)
        .exec(cb);
  },

  whereNameContains : function(name, cb) {
    report.verbose('looking for users whose name contains ' + name);
    app.User.find({'username' : new RegExp(name) }, cb);
  },

  register : function(reqUser, cb) {
    try {
      var salt = crypto.randomBytes(128).toString('base64');
      var hashedpw = crypto.pbkdf2Sync(reqUser.password, salt, 16384, 256).toString('base64');

      var user = new app.User({
        username: reqUser.username,
        salt: salt,
        hashedPassword: hashedpw,
        achievements: [ // init achievements
          {
            name: 'Big Mouth',
            desc: 'Number of messages sent',
            level: 0 // TODO: check if it is needed since we have a default value
          },
          {
            name: 'Talk To Me',
            desc: 'Number of messages received',
            level: 0
          },
          {
            name: 'Cool Kid',
            desc: 'Number of friends',
            level: 0
          },
          {
            name: 'Me Speak Good',
            desc: 'Number of phrases',
            level: 0
          }
        ]
      });

      var email = reqUser.email;
      if (email) user.email = email;

      user.save(cb);
    } catch (err) {
      // crypto function can throw an exception
      cb(err);
    }
  }
}

/******************************************************************************
 * Methods
 */
userSchema.methods = {
  validatePassword : function(pw, cb) {
    return this.hashedPassword === crypto.pbkdf2Sync(pw, this.salt, 16384, 256).toString('base64');
  },

  publicData : function() {
    return {
      userId: this._id,
      name: this.username,
      profile: this.profile,
      msgSentCount: this.msgSentCount,
      msgReceivedCount: this.msgReceivedCount
    };
  },

  achievementForName : function(name) {
    if (this.achievements) {
      for (var i = 0; i < this.achievements.length; ++i) {
        report.debug('looking at achievement ' + JSON.stringify(this.achievements[i]));

        if (this.achievements[i].name.toString() === name) {
          return this.achievements[i];
        }
      }
    }
    return null;
  }
}
