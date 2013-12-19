var models = require('../models')
  , Room = models.Room
  , User = models.User
  , Message = models.Message
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
        report.debug('created new room with id: ' + room.id + ' for users ' + room.memberships);

        res(room);
      });
    }
  },

  onSendMessage: function(socket, event) {
    return function(jsonMessage) {
      var author = socket.handshake.user.id;

      report.debug('user ' + author + ' sends message ' + JSON.stringify(jsonMessage));

      jsonMessage.author = author;

      var message = Message.fromJSON(jsonMessage);

      Room.findById(message.roomId, function(err, room) {
        if (err) {
          return socket.error500(event, 'Could not search for room', err);
        }
        if (! room) {
          return socket.error404(event, 'Room ' + message.roomId + ' not found');
        }

        room.addMessage(message, function(err) {
          if (err) {
            socket.error500(event, 'Could not add message', err);
          }

          for (var key in socket.namespace.sockets) {
            if (socket.namespace.sockets.hasOwnProperty(key)) {
              var clientSocket = socket.namespace.sockets[key];
              var clientId = clientSocket.handshake.user.id;
              // if some member of this room has id clientId, clientId belongs to this room
              if (room.memberships.some(function(membership, index, array) {
                return membership.userId.toString() === clientId;
              })) {
//                if (otherId !== author) {
                  report.debug('forwarding message to ' + clientId + ' who is also connected and in the room');
                  clientSocket.emit('newMessage', message);
//                }
              }
            }
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
