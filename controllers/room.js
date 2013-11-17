var models = require('../models')
  , Room = models.Room
  , User = models.User
  , report = require('../reporter');

module.exports = {
  onCreateRoom: function(socket, event) {
    return function(data) {
      var correspondentName = data.correspondent;

      User.findByUsername(correspondentName, function(err, correspondent) {
        if (err) {
          return socket.error500(event, 'Could not search for user ' + correspondentName, err);
        } else if (! correspondent) {
          return socket.error404(event, 'User ' + correspondentName + ' not found');
        }

        var room = new Room({
          memberships: [ { userId: correspondent.id }, { userId: socket.handshake.user.id } ],
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
  },

  onSendMessage: function(socket, event) {
    return function(data) {
      data.message.author = socket.handshake.user.id;

      Room.findById(data.roomId, function(err, room) {
        if (err) {
          return socket.error500(event, 'Could not search for room', err);
        }
        if (! room) {
          return socket.error404(event, 'Room ' + data.roomId + ' not found');
        }

        room.addMessage(data.message, function(err) {
          if (err) {
            socket.error500(event, 'Could not add message', err);
          }
        });
      });
    }
  }
};
