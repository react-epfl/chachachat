var controller = {
  room: require('./controllers/room')
}

module.exports = {
  socketio: {
    onConnection: function(socket) {
      var user = socket.handshake.user;
      socket.on('createRoom', controller.room.onCreateRoom(socket));
    }
  }
};
