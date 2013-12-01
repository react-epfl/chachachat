
/**
 * Module dependencies.
 */

var express = require('express')
  , socketio = require('socket.io')
  , RedisStore = require('connect-redis')(express)
  , mongoose = require('mongoose')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , passportSocketIO = require('passport.socketio')
  , https = require('https')
  , fs = require('fs')
  , path = require('path')
  , User = require('./models').User
  , report = require('./reporter')
  , routes = require('./routes');

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

var apiLogin = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return res.status(500).sendfile('public/login.html');
    }
    if (! user) {
      return res.status(404).sendfile('public/login.html');
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).sendfile('public/login.html');
      }
      report.verbose('User ' + req.body.username + ' logged in successfully');
      return res.redirect('/');
    });
  })(req, res, next);
};

app.post('/login', apiLogin);

app.post('/register', function(req, res, next) {
  User.register(req.body, function(err) {
    if (err) {
      if (err.code === 11000) {
        res.status(409).send({
          err: "Someone already has that username"
        });
      } else {
        report.error('User could not be saved');
        res.status(500).send({
          err: "Internal server error"
        });
      }
      return;
    }

    report.verbose('User ' + req.body.username + ' registered successfully');

    apiLogin(req, res, next);
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
  report.log('Express server listening on port ' + app.get('port'));
});
