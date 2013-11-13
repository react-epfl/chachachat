
/**
 * Module dependencies.
 */

var express = require('express');
var socketio = require('socket.io');
var RedisStore = require('connect-redis')(express);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var passportSocketIO = require('passport.socketio');
var https = require('https');
var fs = require('fs');
var path = require('path');

var app = express();

// all environments
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
    done(null, {
      username: 'dupont',
      password: 'aignan',
      email: 'test@gmail.com',
      id: 'dupontID'
    });
    // User.findOne({ username: username }, function(err, user) {
    //   if (err) { return done(err); }
    //   if (!user) {
    //     return done(null, false, { message: 'Incorrect username.' });
    //   }
    //   if (!user.validPassword(password)) {
    //     return done(null, false, { message: 'Incorrect password.' });
    //   }
    //   return done(null, user);
    // });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  // User.findById(id, function(err, user) {
  //   done(err, user);
  // });
  done(null, { username: 'dupont',
    password: 'aignan',
    email: 'test@gmail.com',
    id: 'dupontID'
  });
});

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

io.on('connection', function(socket) {
  console.log('user connected to socket.io');
  socket.on('hello', function(data) {
    console.log('user said hello');
    socket.emit('hi', function() {
      console.log('replying with hi');
    })
  })
});

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
