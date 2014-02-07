var models = require('../models')
  , User = models.User
  , userSchema = models.userSchema
  , report = require('../reporter');

var io = null;

function socketsForUser(user) {
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
userSchema.post('save', function(user, maybe, third) {

// TODO: different logics if it is a newly created user or an udpated user

  var sentAchievementSteps = [0, 1, 10, 50, 100, 300, 1000, 5000];

  report.debug('user saved with fields: ' + JSON.stringify(user));

  // check if the # of sent messages corresponds to an achievement step.
  var newTier = -1;
  for (var i = 0; i < sentAchievementSteps.length; ++i) {
    if (sentAchievementSteps[i] === user.msgSentCount) {
      newTier = i;
    }
  }

  // TODO: achievement level 0, what does it mean?
  if (newTier !== -1) {
    report.debug('user reached achievement step: ' + newTier);
  } else {
    report.debug('user did not reach any achievement step');
  }

  // check that the increment has not already been reported
  var isNewAchievement = newTier !== -1 && (user.achievementForType('sent') === null || user.achievementForType('sent').tier < newTier);

  if (isNewAchievement) {
    report.debug('the achievement is new, will notify user');
  }

  if (isNewAchievement) {
    // notify the user that a new achievement has been unlocked
    report.debug('Notifying the user that an achievement has been reached');
    socketsForUser(user).forEach(function(socket) {
      socket.emit('newAchievement', {
        type: 'sent',
        tier: newTier,
        steps: sentAchievementSteps,
      });
    });

    // save the achievement in the user model, iff it has not already been defined
    var achievement = user.achievementForType('sent');
    if (achievement) {
      achievement.tier = newTier;
    } else {
      user.achievements.push({
        type: 'sent',
        tier: newTier
      });
    }
    user.save(function(err) { report.log('user: ' + user.username + '; error while saving achievement tier')});
  }
});

/* triggers for # received achievement */
userSchema.post('save', function(user, maybe, third) {
  var receivedAchievementSteps = [1, 10, 50, 100, 300, 1000, 5000];
});

function UserController(_socketio) {
  io = _socketio;
//  return this;
}

UserController.prototype.onFindUsers = function(socket, event) {
  return function(data, res) {
    var searchedName = data.name;

    User.whereNameContains(searchedName, function(err, users) {
      if (err) {
        return socket.error500(event, 'Could not search users', err);
      }

      res(users
        .filter(function(user) {
          return user.id !== socket.handshake.user.id;
        })
        .map(function(user) {
          return user.publicData();
        })
      );
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
  return function(res) {
    res(socket.handshake.user.achievements);
  };
}

module.exports = exports = UserController;
