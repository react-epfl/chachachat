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

        res(users.map(function(user) {
          return user.publicData();
        }));
      });
    }
  }
};
