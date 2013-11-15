
/**
 * Module dependencies.
 */

var express = require('express');
var socketio = require('socket.io');
var RedisStore = require('connect-redis')(express);
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var passportSocketIO = require('passport.socketio');
var https = require('https');
var fs = require('fs');
var path = require('path');
var winston = require('winston');
var User = require('./models/user').model;
var routes = require('./routes');

var app = express();

// all environments
l = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: true,
      level: 'debug'
    })
  ]
});

var sessionSecret = 'chachachat-application';
var sessionStore = new RedisStore({
  host: 'localhost'
});

app.set('port', process.env.PORT || 3000);
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
  store: sessionStore,
  secret: sessionSecret
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findByUsername(username, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validatePassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

mongoose.connect('mongodb://localhost/chachachat');

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res, next) {
  if (req.isAuthenticated())
    return next();
  else
    res.redirect('/login.html');
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login.html'
}));

app.post('/register', function(req, res) {
  User.register(req.body, function(err) {
    if (err) {
      l.error('User could not be saved');
      res.status(500).send(err);
      return;
    }

    l.verbose('User ' + req.body.username + ' registered successfully');
    res.redirect('/login.html');
  });
});

var credentials = {
  key: fs.readFileSync('config/chachachat-key.pem'),
  cert: fs.readFileSync('config/chachachat-cert.pem')
};

var server = https.createServer(credentials, app);

var io = socketio.listen(server);

io.set('authorization', passportSocketIO.authorize({
  cookieParser: express.cookieParser,
  key: 'connect.sid',
  secret: sessionSecret,
  store: sessionStore
}));

io.on('connection', routes.socketio.onConnection);

server.listen(app.get('port'), function() {
  l.log('Express server listening on port ' + app.get('port'));
});
