var Room = require('../models/room.js').model;
var User = require('../models/user.js').model;

exports.onCreateRoom = function(socket) {
  return function(data) {
    var correspondentName = data.correspondent;

    User.findByUsername(correspondentName, function(err, correspondent) {
      if (err) {
        console.log('Could not search user ' + err);
        return;
      } else if (! correspondent) {
        console.log('User ' + correspondentName + ' not found');
        return;
      }

      var room = new Room({
        members: [ correspondent.id, socket.handshake.user.id ],
      });

      room.save(function(err) {
        if (err) {
          return console.log('Could not save room ' + err);
        }

        socket.emit('roomCreated', {
          roomId: room.id
        });
      });
    });
  }
};
