var models = require('../models');
var User = models.User;
var Achievement = models.Achievement;
var userSchema = models.userSchema;
var report = require('../reporter');

var io = null;

socketsForUser = function(user) {
  report.debug('getting sockets from ' + user._id.toString());

  return io.sockets.clients().filter(function(socket) {
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
}

/* triggers for # sent achievement */
userSchema.post('save', function(user) {
  var achName = 'Big Mouth';
  var sentAchLevels = [1, 10, 50, 100, 300, 1000, 5000];
  var curValue = user.msgSentCount;

  report.debug('a user was saved: ' + user.username);

  Achievement.checkAndNotify(user, achName, sentAchLevels, curValue, function(newAchievementObj) {
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

  Achievement.checkAndNotify(user, achName, receivedAchievementLevels, curValue, function(newAchievementObj) {
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

  Achievement.checkAndNotify(user, achName, receivedAchievementLevels, curValue, function(newAchievementObj) {
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

  Achievement.checkAndNotify(user, achName, phrasesAchievementSteps, curValue, function(newAchievementObj) {
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
  // Achievement.checkAndNotify(user, achName, sentAchLevels, curValue);
});

/* triggers for # phrases sent to different countries */
userSchema.post('save', function(user, maybe, third) {
  var achName = 'Pony Express';
  var receivedAchievementSteps = [1, 10, 50, 100, 300, 1000, 5000];

  // TODO: think how to actually implement it
  // Achievement.checkAndNotify(user, achName, sentAchLevels, curValue);
});

function UserController(_socketio) {
  io = _socketio;
//  return this;
}

UserController.prototype.onGetProfileCharacteristics = function(socket, event) {
  return function(data, res) {
    var userId = socket.handshake.user.id;

    User.getProfileChars(userId, function(err, profileChars) {
      if (err) {
        return socket.error500(event, 'Could not get profile characteristics', err);
      }

      report.debug('User profile characteristics ' + JSON.stringify(profileChars));

      res(profileChars);
    })
  };
};

UserController.prototype.onGetProfileStats = function(socket, event) {
  return function(data, res) {
    var userId = data.peer_id;

    User.getProfileStats(userId, function(err, profileStats) {
      if (err) {
        return socket.error500(event, 'Could not get profile stats', err);
      }

      report.debug('User profile stats ' + JSON.stringify(profileStats));

      res(profileStats);
    })
  };
};

UserController.prototype.onSetProfileChars = function (socket, event) {
  return function(data, res) {
    var userId = socket.handshake.user.id;
    var newChars = data;

    User.setProfileChars(userId, newChars, function(err, profileChars) {
      if (err) {
        return socket.error500(event, 'Could not set profile characteristics', err);
      }

      res();
    })
  };
}

UserController.prototype.onGetUserPhrases = function (socket, event) {
  return function(data, res) {
    var userId = socket.handshake.user.id;

    User.getUserPhrases(userId, function(err, userPhrases) {
      if (err) {
        return socket.error500(event, 'Could not get user phrases', err);
      }

      res(userPhrases);
    });
  };
}

UserController.prototype.onFindUsers = function(socket, event) {
  return function(data, res) {
    var searchedChars = data.characteristics;

    User.findByProfile(searchedChars, function(err, users) {
      if (err) {
        return socket.error500(event, 'Error while searching for users', err);
      }

      var otherUsers = users
        .filter(function(user) {
          return user.id !== socket.handshake.user.id;
        })
        .map(function(user) {
          return user.publicData();
        });

      res(otherUsers);
    });
  };
};

UserController.prototype.onGetUsers = function(socket, event) {
  return function(userIds, res) {
    if (userIds.length === 0) {
      return res([]);
    }

    User.find()
      .or(userIds.map(function(userId) {
        return {
          _id: userId
        };
      }))
      .exec(function(err, users) {
        // TODO: handle error properly
        report.debug('retrieved users ' + users + ' during getUsers, with error ' + err);
        res(users.map(function(user) {
          return user.publicData();
        }));
      });
  };
};

UserController.prototype.onGetAchievements = function(socket, event) {
  return function(data, res) {
    var userId = socket.handshake.user.id;

    User.getUserAchievements(userId, function(err, userAchievements) {
      if (err) {
        return socket.error500(event, 'Could not get user achievements', err);
      }

      res(userAchievements);
    })
  };
}

module.exports = exports = UserController;
