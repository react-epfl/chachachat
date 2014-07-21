/**
 * User controller
 */

'use strict';

/******************************************************************************
 * Module dependencies
 */
var app; //all application-wide things like ENV, config, logger, etc
var apn = require('apn');
var report = require('../reporter');


exports.initController = function (myApp, opts) {
  app = myApp;
};


exports.onSetDeviceToken = function(socket, event) {
  return function(data, res) {
    var userId = socket.handshake.user.id;
    var deviceToken = data;

    app.User.setDeviceToken(userId, deviceToken, function(err, deviceToken) {
      if (err) {
        return socket.error500(event, 'Could not set device token', err);
      }

      // TODO: should we send something?
    })
  };
};


exports.onGetProfileCharacteristics = function(socket, event) {
  return function(data, res) {
    var userId = socket.handshake.user.id;

    app.User.getProfileChars(userId, function(err, profileChars) {
      if (err) {
        return socket.error500(event, 'Could not get profile characteristics', err);
      }

      report.debug('User profile characteristics ' + JSON.stringify(profileChars));

      res(profileChars);
    })
  };
};

exports.onGetProfileStats = function(socket, event) {
  return function(data, res) {
    var userId = data.peer_id;

    app.User.getProfileStats(userId, function(err, profileStats) {
      if (err) {
        return socket.error500(event, 'Could not get profile stats', err);
      }

      report.debug('User profile stats ' + JSON.stringify(profileStats));

      res(profileStats);
    })
  };
};

exports.onSetProfileChars = function (socket, event) {
  return function(data, res) {
    var userId = socket.handshake.user.id;
    var newChars = data;

    app.User.setProfileChars(userId, newChars, function(err, profileChars) {
      if (err) {
        return socket.error500(event, 'Could not set profile characteristics', err);
      }

      res();
    })
  };
}

exports.onGetUserPhrases = function (socket, event) {
  return function(data, res) {
    var userId = socket.handshake.user.id;

    app.User.getUserPhrases(userId, function(err, userPhrases) {
      if (err) {
        return socket.error500(event, 'Could not get user phrases', err);
      }

      res(userPhrases);
    });
  };
}

exports.onFindUsers = function(socket, event) {
  return function(data, res) {
    var searchedChars = data.characteristics;

    app.User.findByProfile(searchedChars, function(err, users) {
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

exports.onGetUsers = function(socket, event) {
  return function(userIds, res) {
    if (userIds.length === 0) {
      return res([]);
    }

    app.User.find()
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

exports.onGetAchievements = function(socket, event) {
  return function(data, res) {
    var userId = socket.handshake.user.id;

    app.User.getUserAchievements(userId, function(err, userAchievements) {
      if (err) {
        return socket.error500(event, 'Could not get user achievements', err);
      }

      res(userAchievements);
    })
  };
}
