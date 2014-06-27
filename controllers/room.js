/**
 * Room controller
 */

'use strict';

/******************************************************************************
 * Module dependencies
 */
var app //all application-wide things like ENV, config, logger, etc
var report = require('../reporter');;
var apn = require('apn');

module.exports = {

  initController : function (myApp, opts) {
    app = myApp;
  },

  onCreateRoom: function(socket, event) {
    return function(data, res) {
      var members = data.correspondentsId;
      members.push(socket.handshake.user.id);

      if (! members.some(function(user) { return user.id !== socket.handshake.user.id })) {
        return socket.error(event, 'Can not discut with self');
      }

      app.Room.createRoom(members, function(err, room) {
        if (err) {
          return socket.error500(event, 'Could not create room', err);
        }
        report.debug('created new room with id: ' + room.id + ' for users ' + room.memberships);

        var roomJSON = room.toJSON();

        roomJSON = room.populateMemberships(roomJSON, function(err, roomJSON) {
          // TODO: error handling
          res(roomJSON);
        });
      });
    }
  },

  /**
   * Handles message send from one
   */
  onSendMessage: function(socket, event) {
    return function(jsonMessage) {
      var author = socket.handshake.user.id;

      report.debug('user ' + author + ' sends message ' + JSON.stringify(jsonMessage));

      jsonMessage.author = author;
      var message = app.Message.fromJSON(jsonMessage);

      app.Room.findById(message.roomId)
          .populate('memberships.userId', 'token')
          .exec(function(err, room) {
        if (err) {
          return socket.error500(event, 'Error while searching for a room', err);
        }

        if (!room) {
          return socket.error404(event, 'Room ' + message.roomId + ' not found');
        }

        room.addMessage(message, function(err) {
          if (err) {
            socket.error500(event, 'Could not add message', err);
          }

          // TODO: do notification of sockets in a room with sockets.in(roomId).emit
          // send message to room members via socket
          for (var key in socket.namespace.sockets) {
            if (socket.namespace.sockets.hasOwnProperty(key)) {
              var clientSocket = socket.namespace.sockets[key];
              var clientId = clientSocket.handshake.user.id;
              // if some member of this room has id clientId, clientId belongs to this room
              var isClientInRoom = room.memberships.some(
                function(membership, index, array) {
                  return membership.userId.id === clientId;
                });

              if (isClientInRoom) {
                report.debug('forwarding message to ' + clientId + ' who is also connected and in the room');
// TODO: we should send not the mongoose object to the client here, but something like jsonMessage
                clientSocket.emit('newMessage', message._doc);
              }
            }
          }
        });

        app.User.findById(author, 'username', function (err, user) {
          // create a push notification
          var note = new apn.Notification();
          note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
          note.badge = 1;
          note.sound = "ping.aiff";
          note.alert = user.username + ' has sent a new message';
          note.payload = {'roomId': room.id};

          // send message to room members via apple push notifications
          room.memberships.forEach(function(membership) {
            if (membership.userId.id !== author) { // don't notify the author
              // membership.userId.tokens.forEach(function(deviceToken) { // several devices per user
                var deviceToken = membership.userId.token;
                if (deviceToken) { // for the emulator there is no deviceToken
                  var device = new apn.Device(deviceToken);
                  app.apnConnection.pushNotification(note, device);
                }
              // })
            }
          })
        })
      });
    }
  },

  onFetchMessages: function(socket, event) {
    return function(data) {
      var userId = socket.handshake.user._id;
      var since = data.since;

      app.Room.messagesSince(userId, since, function(err, messagesByRoom) {
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
  },

  onGetRooms: function(socket, event) {
    return function(res) {
      var user = socket.handshake.user;

      app.Room.roomsForUser(user, function(err, rooms) {
        if (err) {
          return report.debug('While getRooms, got error ' + err);
        }
        report.debug('Found rooms ' + rooms.length);

        var roomsJSON = rooms.map(function(room) {
          return room.toJSON();
        })

        res(roomsJSON);
      });
    };
  }
};
