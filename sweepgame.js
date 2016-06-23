var io;
var gameSocket;

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Host Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);
    //gameSocket.on('hostNextRound', hostNextRound);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    //gameSocket.on('playerAnswer', playerAnswer);

    // Game Events
    gameSocket.on('initialDealOccured', initialDealOccured);
    gameSocket.on('firstTurnCardSelected', showInitialStage);
    gameSocket.on('moveSubmitted', moveSubmitted);

    //PostGame Events
    gameSocket.on('quitGame', quitGameRequested);
    gameSocket.on('restartRequested', restartRequested);
}
/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */

/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */
function hostCreateNewGame() {
    // Create a unique Socket.IO Room
    var thisGameId = ( Math.random() * 100000 ) | 0;

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

    // Join the Room and wait for the players
    this.join(thisGameId.toString());
};

/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
function hostPrepareGame(data) {
    var sock = this;
    var newData = {
        mySocketId : sock.id,
        gameId : data.gameId,
        hostName : data.hostName
    };
    io.sockets.in(data.gameId).emit('beginNewGame', newData);
}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId) {
    console.log('Game Started.');
    
};
/* *****************************
   *                           *
   *     PLAYER FUNCTIONS      *
   *                           *
   ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function playerJoinGame(data) {
    //console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = gameSocket.manager.rooms["/" + data.gameId];

    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Join the room
        sock.join(data.gameId);

        //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }
}


function quitGameRequested(gameId) {
    io.sockets.in(data.gameId).emit('initiateQuitGame');
}


function restartRequested(gameId) {
   io.sockets.in(gameId).emit('restart');
}


/* *************************
   *                       *
   *      GAME LOGIC       *
   *                       *
   ************************* */


function initialDealOccured(data) {
    io.sockets.in(data.gameId).emit('playerShowFirstStage', data);
}

function showInitialStage(data) {
    io.sockets.in(data.gameId).emit('unHideFirstStage', data);
}

function moveSubmitted(data) {
    io.sockets.in(data.gameId).emit('postMoveSubmitted', data);
}
