var report = require('./reporter');

function Routes(io) {
  var User = require('./controllers/user');
  var controller = {
    room: require('./controllers/room'),
    user: new User(io)
  }

  this.onIOConnection = function(socket) {
    var user = socket.handshake.user;
    report.verbose('user ' + user.username + ' connected through websocket.');

    report.addErrorHandling(socket);

    socket.on('fetchMessages', controller.room.onFetchMessages(socket, 'fetchMessages'));
    socket.on('createRoom', controller.room.onCreateRoom(socket, 'createRoom'));
    socket.on('getRooms', controller.room.onGetRooms(socket, 'getRooms'));
    socket.on('sendMessage', controller.room.onSendMessage(socket, 'sendMessage'));


    socket.on('findUsers', controller.user.onFindUsers(socket, 'findUsers'));
    socket.on('getUsers', controller.user.onGetUsers(socket, 'getUsers'));
    socket.on('getAchievements', controller.user.onGetAchievements(socket, 'getAchievements'));

    socket.on('getProfileCharacteristics', controller.user.onGetProfileCharacteristics(socket, 'getProfileCharacteristics'));
    socket.on('setProfileCharacteristics', controller.user.onSetProfileChars(socket, 'setProfileCharacteristics'));

    // socket.on('getUserPhrases', controller.user.onGetUserPhrases(socket, 'getUserPhrases'));

  };

  return this;
}

exports = module.exports = Routes;
