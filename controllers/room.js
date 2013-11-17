var models = require('../models')
  , Room = models.Room
  , User = models.User
  , report = require('../reporter');

exports.onCreateRoom = function(socket, event) {
  return function(data) {
    var correspondentName = data.correspondent;

    User.findByUsername(correspondentName, function(err, correspondent) {
      if (err) {
        return socket.error500(event, 'Could not search for user ' + correspondentName, err);
      } else if (! correspondent) {
        return socket.error404(event, 'User ' + correspondentName + ' not found');
      }

      var room = new Room({
        members: [ { userId: correspondent.id }, { userId: socket.handshake.user.id } ],
      });

      room.save(function(err) {
        if (err) {
          return socket.error500(event, 'Could not save room', err);
        }

        socket.emit('roomCreated', {
          roomId: room.id
        });
      });
    });
  }
};
