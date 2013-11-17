module.exports = {
  //TODO Unify socket.io and http error-reporting logic
  addErrorHandling: function(socket) {
    socket.error500 = function(event, message, err) {
      log.error('On ' + event + ': ' + message + ', with error ' + err);

      socket.emit(event, {
        status: 500,
        err: message
      });
    };

    socket.error404 = function(event, message, err) {
      log.warn('On ' + event + ': ' + message + ', with error ' + err);

      socket.emit(event, {
        status: 404,
        err: message
      });
    };
  }
};
