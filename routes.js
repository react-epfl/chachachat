var controller = require('./controllers');

module.exports = {
  socketio: {
    onConnection: function(socket) {
      var user = socket.handshake.user;
      l.verbose('user ' + user.username + ' connected through websocket.');
      socket.on('createRoom', controller.room.onCreateRoom(socket));
    }
  }
};
