module.exports = function (Game) {

}

module.exports = function (Game, socket, io) {
    var app = require('../../server/server');
    if (typeof (socket) != 'undefined') {

        socket.on('play', function (playerData, fn) {
            //find available opponent
            var player = app.models.player;
            player.findOne({ where: { status: 'online', id: { neq: playerData.id } } }, function (error, findResult) {

                if (findResult != null) {
                    console.log(findResult.id);
                    //  socket.emit(findResult.id, 'Lobby');
                    var challange = 'challange:' + findResult.id;
                    var opponent = {};
                    opponent.username = playerData.username;
                    opponent.id = playerData.id;
                    socket.broadcast.emit(challange, opponent);
                    fn(findResult);
                }
                else {
                    var error = {};
                    error.name = 'NO_AVAILABLE_OPPONENT'
                    error.status = 404;
                    error.message = 'There is no online user';
                    fn(error);
                }

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
            newGame.nextPlayer = players[1].id;
            newGame.steps = [];
            newGame.typeOfIcon = [{ "playerId": players[0].id, "type": "circle" }, { "playerId": players[1].id, "type": "cross" }];
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

            var player = app.models.player;
            player.findById(players[0].id, function (error, findResult) {
                findResult.play = findResult.play + 1;
                findResult.save();
            });

            player.findById(players[1].id, function (error, findResult) {
                findResult.play = findResult.play + 1;
                findResult.save();
            });

            Game.create(newGame, function (error, createGameResult) {
                io.sockets.in(roomId).emit('game', roomId, createGameResult);



            })
        });

        socket.on('endGame', function (data) {
            Game.findById(data.id, function (error, result) {
                var player = app.models.player;
                if (result.players[0].id == data.player.id) {
                    player.findById(result.players[0].id, function (error, findResult) {
                        findResult.defeat = findResult.defeat + 1;
                        findResult.save();
                    });

                    player.findById(result.players[1].id, function (error, findResult) {
                        findResult.win = findResult.win + 1;
                        findResult.save();
                    });

                    result.winner = result.players[1];
                }
                else {

                    player.findById(result.players[0].id, function (error, findResult) {
                        findResult.win = findResult.win + 1;
                        findResult.save();
                    });

                    player.findById(result.players[1].id, function (error, findResult) {
                        findResult.defeat = findResult.defeat + 1;
                        findResult.save();
                    });

                    result.winner = result.players[0];
                }


                result.endDate = new Date();
                result.save();

                io.sockets.in(data.room).emit('gameEnded', result, data.player);
            });
        })

        socket.on('movement', function (data) {
            Game.findById(data.id, function (error, result) {
                var index = data.data.id - 1;
                result.steps[index].player = data.player;
                result.steps[index].type = data.type;

                if (result.players[0].id == data.player.id) {
                    result.nextPlayer = result.players[1].id;
                }
                else {
                    result.nextPlayer = result.players[0].id;
                }

                if (result.steps[0].type == data.type && result.steps[1].type == data.type & result.steps[2].type == data.type) {
                    result.endDate = new Date();
                    result.winner = data.player;
                }
                else if (result.steps[3].type == data.type && result.steps[4].type == data.type & result.steps[5].type == data.type) {
                    result.endDate = new Date();
                    result.winner = data.player;
                }
                else if (result.steps[6].type == data.type && result.steps[7].type == data.type & result.steps[8].type == data.type) {
                    result.endDate = new Date();
                    result.winner = data.player;
                }
                else if (result.steps[0].type == data.type && result.steps[3].type == data.type & result.steps[6].type == data.type) {
                    result.endDate = new Date();
                    result.winner = data.player;
                }
                else if (result.steps[1].type == data.type && result.steps[4].type == data.type & result.steps[7].type == data.type) {
                    result.endDate = new Date();
                    result.winner = data.player;
                }
                else if (result.steps[2].type == data.type && result.steps[5].type == data.type & result.steps[8].type == data.type) {
                    result.endDate = new Date();
                    result.winner = data.player;
                }
                else if (result.steps[0].type == data.type && result.steps[4].type == data.type & result.steps[8].type == data.type) {
                    result.endDate = new Date();
                    result.winner = data.player;
                }
                else if (result.steps[2].type == data.type && result.steps[4].type == data.type & result.steps[6].type == data.type) {
                    result.endDate = new Date();
                    result.winner = data.player;
                }

                result.save();

                var isGameDraw = true;
                for (var i = 0; i < result.steps.length; i++) {
                    if (result.steps[i].type == 'none') {
                        isGameDraw = false;
                    }
                }
                var player = app.models.player;
                if (isGameDraw) {
                    player.findById(result.players[0].id, function (error, findResult) {
                        findResult.draw = findResult.draw + 1;
                        findResult.save();
                    });

                    player.findById(result.players[1].id, function (error, findResult) {
                        findResult.draw = findResult.draw + 1;
                        findResult.save();
                    });

                    io.sockets.in(data.room).emit('gameDraw', result);
                }
                else {
                    if (result.winner != null) {
                        player.findById(result.winner.id, function (error, findResult) {
                            findResult.win = findResult.win + 1;
                            findResult.save();
                        });

                        if (result.winner.id != result.players[0].id) {
                            player.findById(result.players[0].id, function (error, findResult) {
                                findResult.defeat = findResult.defeat + 1;
                                findResult.save();
                            });
                        }
                        if (result.winner.id != result.players[1].id) {
                            player.findById(result.players[1].id, function (error, findResult) {
                                findResult.defeat = findResult.defeat + 1;
                                findResult.save();
                            });
                        }

                    }
                    io.sockets.in(data.room).emit('movement', result);
                }
            })
        })
    };
};
