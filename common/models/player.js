module.exports = function (Good) {

};

module.exports = function (Player, socket) {
    if (typeof (socket) != 'undefined') {

        socket.on('createPlayer', function (username, fn) {
            if (typeof (username) != 'undefined') {
                Player.findOne({ where: { username: username } }, function (error, findResult) {
                    if (findResult == null) {
                        var newUser = {};
                        newUser.username = username;
                        newUser.joinDate = new Date();
                        newUser.point = 0;
                        newUser.win = 0;
                        newUser.draw = 0;
                        newUser.socketId = socket.id;
                        newUser.defeat = 0;
                        newUser.status = "online";
                        Player.create(newUser, function (error, createResult) {
                            var response = {};
                            response.message = 'Successfully created a new player';
                            response.player = createResult;
                            response.status = 200;
                            fn(response);
                        })
                    }
                    else {
                        var error = {};
                        error.name = 'ALREADY_EXIST'
                        error.status = 409;
                        error.message = 'Username already exist';
                        fn(error);
                    }
                });
            }

            else {
                var error = {};
                error.name = 'BAD_REQUEST'
                error.status = 400;
                error.message = 'Username is empty';
                fn(error);
            }

        })
    }
};
