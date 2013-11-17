var controller = require('./controllers')
  , reporter = require('./reporter');

module.exports = {
  socketio: {
    onConnection: function(socket) {
      var user = socket.handshake.user;
      log.verbose('user ' + user.username + ' connected through websocket.');

      reporter.addErrorHandling(socket);

      socket.on('createRoom', controller.room.onCreateRoom(socket, 'createRoom'));
    }
  }
};
