var controller = require('./controllers')
  , report = require('./reporter');

module.exports = {
  socketio: {
    onConnection: function(socket) {
      var user = socket.handshake.user;
      report.verbose('user ' + user.username + ' connected through websocket.');

      report.addErrorHandling(socket);

      socket.on('createRoom', controller.room.onCreateRoom(socket, 'createRoom'));
      socket.on('sendMessage', controller.room.onSendMessage(socket, 'sendMessage'));
    }
  }
};
