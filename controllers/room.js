var models = require('../models')
  , Room = models.Room
  , User = models.User
  , report = require('../reporter');

module.exports = {
  onCreateRoom: function(socket, event) {
    return function(data, res) {
      var members = data.correspondentsId;
      members.push(socket.handshake.user.id);

      Room.createRoom(members, function(err, room) {
        if (err) {
          return socket.error500(event, 'Could not create room', err);
        }

        report.debug('new room with id: ' + room.id + ' for users ' + room.memberships);

        res({ roomId: room.id });
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
  },

  onFetchMessages: function(socket, event) {
    return function(data) {
      var userId = socket.handshake.user._id;
      var since = data.since;

      Room.messagesSince(userId, since, function(err, messagesByRoom) {
        if (err) {
          return socket.error500(event, 'Could not search in room collection', err);
        }
        if (! messagesByRoom) {
          messagesByRoom = [];
        }

        messagesByRoom.map(function(messages) {
          return {
            roomId: messages._id,
            messages: messages.messages
          };
        });

        socket.emit('newMessages', messagesByRoom);
      });
    }
  }
};
