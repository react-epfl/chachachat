/**
 * Achievement model
 */

'use strict';

/******************************************************************************
 * Module dependencies
 */
var app; //all application-wide things like ENV, models, config, logger, etc
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var report = require('../reporter');
// var User = require('./user').model;

exports.initModel = function (myApp) {
  app = myApp;
};

/******************************************************************************
 * Schema
 */
var achievementSchema = exports.Schema = new Schema({
  name: String,
  desc: String,
  level: { type: Number, default: 0 }
});

/******************************************************************************
 * Statics
 */
achievementSchema.statics = {
  check : function(user, achName, achLevels, curValue, cb) {
    if (!user.achievements) return; // a dirty hack since sometimes this field is undefined

    var newLevel = 0; // the achievement was not assigned yet

    for (var i = achLevels.length-1; i >= 0 ; i--) {
      if (curValue >= achLevels[i]) {
        newLevel = i+1; // > achLevels[0] means that the newLevel=1
        // TODO: change to 'while' loop to avoid 'break'
        break;
      }
    }

    // check if the new level was reached
    // TODO: user.achievementForName only once
    var curLevel = user.achievementForName(achName).level;
    var isNewAchievement = !user.achievementForName(achName) // there was no such an achievement
      || newLevel > curLevel;            // the achievement has reached a new level;

    if (isNewAchievement) {
      // compute steps till the next level
      var untilNext = achLevels[curLevel+1] - curValue;

      // notify the user about the new achievement
      report.debug('Level ' + newLevel + ' of achievement ' + achName + ' was reached with value ' + curValue);

      // save the achievement in the user model, iff it has not already been defined
      var achievement = user.achievementForName(achName);

      if (achievement) {
        achievement.level = newLevel;
      } else {
        user.achievements.push({
          name: achName,
          level: newLevel
        });
      }

      user.save(function(err, savedUser) {
        if (err) report.error('Error while saving achievement level for user: ' + user.username);

        var newAchievementObj = {
          name: achName,
          level: newLevel,
          value: curValue,
          untilNext: untilNext,
        };

        cb(savedUser, newAchievementObj);
      });
    }

    cb(user, null);
  }
}

/******************************************************************************
 * Methods
 */
achievementSchema.methods = {
  toJSON : function() {
    return {
      name: this.name,
      level: this.level
    };
  },
}
