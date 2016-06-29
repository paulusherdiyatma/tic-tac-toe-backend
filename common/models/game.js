module.exports = function (Game) {

}

module.exports = function (Game, socket, io) {
    var app = require('../../server/server');
    if (typeof (socket) != 'undefined') {
        // socket.on('createGame', function (players) {
        //     // socket.username = username;
        //     socket.room = 'Lobby';
        //     // usernames[username] = username;
        //     socket.join('Lobby');
        //     socket.emit('createGameResult', 'SERVER', 'you have connected to Lobby');
        //     socket.broadcast.to('Lobby').emit('createGameResult', 'SERVER', ' has connected to this room');
        //     socket.emit('createGameResult', 'Lobby');
        // });

        socket.on('play', function (playerData) {
            //find available opponent
            var player = app.models.player;
            player.findOne({ where: { status: 'online', id: { neq: playerData.id } } }, function (error, findResult) {
                console.log(findResult.id);
                //  socket.emit(findResult.id, 'Lobby');
                var challange = 'challange:' + findResult.id;
                var opponent = {};
                opponent.username = playerData.username;
                opponent.id = playerData.id;
                socket.broadcast.emit(challange, opponent);
            });
        });

        socket.on('accept', function (roomId, players) {
            socket.join(roomId);
            var accepted = 'accepted:' + players[1].id;
            socket.broadcast.emit(accepted, roomId, players);
        });

        socket.on('reject', function (players) {
            var rejected = 'rejected:' + players[1].id;
            socket.broadcast.emit(rejected, players[0]);
        });

        socket.on('joinRoom', function (roomId, players) {
            socket.join(roomId);
            var newGame = {};
            newGame.createDate = new Date();
            newGame.players = players;
            newGame.winner = null;
            newGame.steps = [];
            newGame.typeOfIcon = [{"playerId":players[0].id, "type":"circle"}, {"playerId":players[1].id, "type":"cross"}];
            var stepCount = 1;
            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 3; j++) {
                    var step = {};
                    step.type = 'none';
                    step.player = null;
                    step.id = stepCount;
                    stepCount++;
                    newGame.steps.push(step);
                }
            }

            Game.create(newGame, function (error, createGameResult) {
                io.sockets.in(roomId).emit('game', roomId, createGameResult);
            })
        });

        socket.on('movement', function (data) {
            Game.findById(data.id, function(error, result){
                var index = data.data.id - 1;
                result.steps[index].player = data.player;
                result.steps[index].type = data.type;
                result.save(); 

                io.sockets.in(data.room).emit('movement', result);
            })
            // io.sockets.in(data.room).emit('movement', data.message);
        })
        //create game
    };
};
