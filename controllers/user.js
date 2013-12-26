var models = require('../models')
  , User = models.User
  , report = require('../reporter');

module.exports = {
  onFindUsers: function(socket, event) {
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
    }
  },

  onGetUsers: function(socket, event) {
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
          report.debug('retrieved users ' + users + ' during getUsers, with error ' + err);
          res(users.map(function(user) {
            return user.publicData();
          }));
        });
    };
  }
};
