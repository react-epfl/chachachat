
/**
 * Module dependencies.
 */

var express = require('express');
var https = require('https');
var fs = require('fs');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var credentials = {
  key: fs.readFileSync('config/chachachat-key.pem'),
  cert: fs.readFileSync('config/chachachat-cert.pem')
};

var server = https.createServer(credentials, app);

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
