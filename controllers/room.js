var models = require('../models')
  , Room = models.Room
  , User = models.User;

exports.onCreateRoom = function(socket) {
  return function(data) {
    var correspondentName = data.correspondent;

    User.findByUsername(correspondentName, function(err, correspondent) {
      if (err) {
        log.error('Could not search user ' + err);
        return;
      } else if (! correspondent) {
        log.warn('User ' + correspondentName + ' not found');
        return;
      }

      var room = new Room({
        members: [ { userId: correspondent.id }, { userId: socket.handshake.user.id } ],
      });

      room.save(function(err) {
        if (err) {
          log.error('Could not save room ' + err);
          return;
        }

        socket.emit('roomCreated', {
          roomId: room.id
        });
      });
    });
  }
};
