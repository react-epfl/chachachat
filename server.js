// TODO: file documentation

var express = require('express');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var socketio = require('socket.io');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var passportSocketIO = require('passport.socketio');
var http = require('http'); // on production we use stunnel as a ssl connection point
var https = require('https'); // to be able to test locally
var fs = require('fs');
var path = require('path');
var apn = require('apn');
var report = require('./reporter');
var Routes = require('./routes');

var app = express();

// all environments
var sessionSecret = 'chachachat-application';

// Redis session store
var sessionStore = new RedisStore({
  host: 'localhost'
});

// MongoDB connection
mongoose.connection.on('error', function(err) {
  report.info('MongoDB connection error: ' + err.message);
});

mongoose.connection.on("open", function() {
  report.info('MongoDB connection established');
});

mongoose.connect('mongodb://localhost/chachachat');

// Apple push notifications connection
var dev_cert_path = path.join(__dirname, 'cert.pem');
var dev_key_path = path.join(__dirname, 'key.pem');

// TODO: move to a config file
var apnOptions = {
  'production': app.get('env') === 'production',
  'cert': dev_cert_path,
  'key': dev_key_path,
  'passphrase':'12345'
};

var apnConnection = new apn.Connection(apnOptions);

apnConnection.on('connected', function (res) {
  report.info('Connection with Apple push notifications established: ' + JSON.stringify(res));
});

apnConnection.on('disconnected', function (res) {
  report.info('Disconnected from Apple push notifications: ' + JSON.stringify(res));
});

apnConnection.on('transmitted', function (res){
  report.info('A push notification was sent: ' + JSON.stringify(res));
});

apnConnection.on('error', function (res){
  report.error('An error occured when sending a push notification: ' + JSON.stringify(res));
});

apnConnection.on('transmissionError', function (res){
  report.error('A transmission error occured when sending a push notification: ' + JSON.stringify(res));
});

apnConnection.on('socketError', function (err){
  report.error('An Apple push notifications socket connection experienced an error: ' + JSON.stringify(err));
});

app.apnConnection = apnConnection;

// Bootstrap models
var camelize = function (underscored, upcaseFirstLetter) {
  var res = '';
  underscored.split('_').forEach(function (part) {
    res += part[0].toUpperCase() + part.substr(1);
  });
  return upcaseFirstLetter ? res : res[0].toLowerCase() + res.substr(1);
};

var modelsDir = './models/';
fs.readdirSync(modelsDir).forEach(function(file) {
  var fileName, model, modelName;
  model = require(modelsDir + file);
  fileName = file.replace(/.js$/, "");
  modelName = camelize(fileName, true);
  app[modelName] = mongoose.model(modelName, model.Schema);
  return model.initModel(app);
});
report.info('Models initialised');


app.set('port', process.env.PORT || 3000);
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());

app.use(session({
  store: sessionStore,
  secret: sessionSecret,
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

passport.use(new LocalStrategy(
  function(username, password, done) {
    app.User.findByUsername(username, function(err, user) {
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
  app.User.findById(id, function(err, user) {
    done(err, user);
  });
});

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

app.get('/', function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login.html');
  }
});


var apiLogin = function(req, res, next) {
  passport.authenticate('local', function(err, user) {
    if (err) {
      return res.status(500).sendfile('public/login.html');
    }

    if (!user) {
      return res.status(404).sendfile('public/login.html');
    }

    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).sendfile('public/login.html');
      }
      report.verbose('User ' + req.body.username + ' logged in successfully');

// TODO: a bug, should send back  real phrases back

// TODO: get user phrases
// user.initPhrases
      var userPhrases = ['123 456 789', 'abc def', 'klm', 'nop'];

      res.send({
        userId: user.id,
        userPhrases: userPhrases
      });
    });
  })(req, res, next);
};

app.post('/login', apiLogin);

app.post('/register', function(req, res, next) {
  app.User.register(req.body, function(err) {

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

var server = http.createServer(app);
var io = socketio.listen(server);

io.set('authorization', passportSocketIO.authorize({
  cookieParser: express.cookieParser,
  key: 'connect.sid',
  secret: sessionSecret,
  store: sessionStore
}));
app.io = io;

// Bootstrap controllers
var controllersDir = './controllers';
fs.readdirSync(controllersDir).forEach(function(file) {
  var controller;
  controller = require(controllersDir + "/" + file);
  return controller.initController(app);
});
report.info('Controllers initialised');


var routes = new Routes(io);

io.on('connection', routes.onIOConnection);

server.listen(app.get('port'), function() {
  report.info('Express server listening on port ' + app.get('port'));
});
