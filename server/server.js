var loopback = require('loopback');
var boot = require('loopback-boot');
var io = require('socket.io');
var app = module.exports = loopback();
var player = require('../common/models/player');
var game = require('../common/models/game');

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) {
    
    app.io = require('socket.io')(app.start());
    
    

    app.io.on('connection', function (socket) {
      player(app.models.player,socket);
      game(app.models.game, socket,app.io);
      socket.on('connection', function(){

      })
      socket.on('disconnect', function () {
        console.log('user disconnected');
      });
    })
  }
});