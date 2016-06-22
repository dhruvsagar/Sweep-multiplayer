;
var appi;
jQuery(function($){   

    /**
     * All the code relevant to Socket.IO is collected in the IO namespace.
     *
     * @type {{init: Function, bindEvents: Function, onConnected: Function, onNewGameCreated: Function, playerJoinedRoom: Function, beginNewGame: Function, onNewWordData: Function, hostCheckAnswer: Function, gameOver: Function, error: Function}}
     */
    var IO = {

        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            console.log("done0");
            IO.socket = io.connect();
            console.log("done1");
            IO.bindEvents();
        },

        /**
         * While connected, Socket.IO will listen to the following events emitted
         * by the Socket.IO server, then run the appropriate function.
         */
        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('playerShowFirstStage', IO.playerShowFirstStage);
            IO.socket.on('unHideFirstStage', IO.unHideFirstStage);
            IO.socket.on('postMoveSubmitted', IO.postMoveSubmitted);
            IO.socket.on('initiateQuitGame', IO.initiateQuitGame);

            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('restart', IO.restart );
        },

        /**
         * The client is successfully connected!
         */
        onConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.socket.sessionid;
            //console.log(data.message);
        },

        /**
         * A new game has been created and a random game ID has been generated.
         * @param data {{ gameId: int, mySocketId: * }}
         */
        onNewGameCreated : function(data) {
            App.Host.gameInit(data);
        },

        /**
         * A player has successfully joined the game.
         * @param data {{playerName: string, gameId: int, mySocketId: int}}
         */
        playerJoinedRoom : function(data) {
            // When a player joins a room, do the updateWaitingScreen funciton.
            // There are two versions of this function: one for the 'host' and
            // another for the 'player'.
            //
            // So on the 'host' browser window, the App.Host.updateWiatingScreen function is called.
            // And on the player's browser, App.Player.updateWaitingScreen is called.
            App[App.myRole].updateWaitingScreen(data);
        },

        /**
         * Both players have joined the game.
         * @param data
         */
        beginNewGame : function(data) {
            App[App.myRole].gameCountdown(data);
        },

        /**
         * A new set of words for the round is returned from the server.
         * @param data
         */
        playerShowFirstStage : function(data) {

            // Change the word for the Host and Player
            console.log("Please happen dude");
            App[App.myRole].showFirstStage(data);
        },

        /**
         * A player answered. If this is the host, check the answer.
         * @param data
         */
        unHideFirstStage : function(data) {
            if (App.myRole == "Player")
                App.Player.unHideFirstStagePlayer(data);
        },

        postMoveSubmitted : function(data) {
            App.postMoveSubmitted(data);
        },

        /**
         * Let everyone know the game has ended.
         * @param data
         */
        gameOver : function(data) {
            App[App.myRole].endGame(data);
        },

        /**
         * An error has occurred.
         * @param data
         */
        initiateQuitGame : function() {
            if (confirm("Opponent has quit game!"));
                window.location.reload();
        },

        restart : function() {
            App.restartGame();
        }

    };

    var App = {

        /**
         * Keep track of the gameId, which is identical to the ID
         * of the Socket.IO Room used for the players and host to communicate
         *
         */
        gameId: 0,

        /**
         * This is used to differentiate between 'Host' and 'Player' browsers.
         */
        myRole: '',   // 'Player' or 'Host'

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        mySocketId: '',

        /**
         * Identifies the current round. Starts at 0 because it corresponds
         * to the array of word data stored on the server.
         */
        currentRound: 0,

        /**
             * Contains references to player data
             */
        players : [],

        restart : false,
        opponentRestart : false,

        /* *************************************
         *                Setup                *
         * *********************************** */

        /**
         * This runs when the page initially loads.
         */
        init: function () {
            console.log("app.init() being called");
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();

            // Initialize the fastclick library
            //FastClick.attach(document.body);
        },

        /**
         * Create references to on-screen elements used throughout the game.
         */
        cacheElements: function () {
            console.log("Elements are being cached");
            App.$doc = $(document);
            // Templates
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$templateMainGame = $('#main-game-template').html();

            //Todo: Remove this Template and its use from everywhere
            //App.$hostGame = $('#host-game-template').html();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function () {
            // Host
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);
            App.$doc.on('click', '#btnEnteredHostName', App.Host.onAcceptClick);

            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);


            //Game
            App.$doc.on('click', '#pileBtn', App.onPileClick);
            App.$doc.on('click', '#pickBtn', App.onPickClick);

            //Post game
            App.$doc.on('click', '#restartBtn', App.onRestart);
            App.$doc.on('click', '#newGameBtn', App.onNewGame);
            

            //Dont think these are needed
            App.$doc.on('click', '.btnAnswer',App.Player.onPlayerAnswerClick);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        /**
         * Show the initial Anagrammatix Title Screen
         * (with Start and Join buttons)
         */
        showInitScreen: function() {
            console.log("intro screen should show");
            App.$gameArea.html(App.$templateIntroScreen);
            //App.doTextFit('.title');
        },

        onPileClick : function() {
            if (submitMove(false)) {
                var data = {
                    gameId : App.gameId,
                    PFCards : PFCards,
                    PSCards : PSCards,
                    PFPile : PFPile,
                    PSPile : PSPile,
                    stagePiles : stagePiles,
                    turn : turn,
                    turnSummary : App.summarizeMove(true) 
                };
                IO.socket.emit('moveSubmitted', data);
            }
        },

        onPickClick : function() {
            var thisTurn = turn;
            if (submitMove(true)) {
                var data = {
                    gameId : App.gameId,
                    PFCards : PFCards,
                    PSCards : PSCards,
                    PFPile : PFPile,
                    PSPile : PSPile,
                    stagePiles : stagePiles,
                    turn : turn,
                    lastPickup : thisTurn%2 == 1 ? 1 : 2,
                    turnSummary : App.summarizeMove(false)
                };
                IO.socket.emit('moveSubmitted', data);
            }
        },

        summarizeMove : function(boolMakePile) {
            var handCard = $('#hand .selected').text();
            var stageCards = '';
            var length = $('#stage .selected').length;   
            if (length == 0) {
                return ' used a ' + handCard + ' from the hand and made a new pile'; 
            }         
            for (var i=0; i < length; i++) {
                if ( $($('#stage .selected')[i]).text().indexOf('+') != -1) {
                    stageCards += ' a pile of ' + $($('#stage .selected')[i]).text().charAt(0)
                        + ((i == length - 2) ? ' and' : ((i==length - 1) ? '' : ', ')); 
                } else {
                    stageCards += ' a ' + $($('#stage .selected')[i]).text() + ((i == length - 2) ? ' and' : ((i==length - 1) ? '' : ', ')); 
                }
            }

            var turnSummary = ' used a ' + handCard + ' from the hand and \n'
                + 'combined it with' + stageCards + '\n from the stage to ' + (boolMakePile ? 'make a pile.' : 'pick up the pile.') ;
            return turnSummary;         
        },

        postMoveSubmitted : function(data) {
            PFCards = data.PFCards;
            PSCards = data.PSCards;
            PFPile = data.PFPile;
            PSPile = data.PSPile;
            stagePiles = data.stagePiles;
            turn = data.turn;            
            if (data.lastPickup) {
                lastPickup = data.lastPickup;
            }
            if (PFCards.length == 0 && PSCards.length == 0 && App.myRole == "Host") {
                deal(false);
                var newData = {
                    gameId : App.gameId,
                    PFCards : PFCards,
                    PSCards : PSCards,
                    PFPile : PFPile,
                    PSPile : PSPile,
                    stagePiles : stagePiles,
                    turn : turn,
                    turnSummary : data.turnSummary + ' The second half of the deck got shuffled.'
                };
                IO.socket.emit('moveSubmitted', newData);
                return;
            }
            if(stagePiles.length == 0 && turn < 49 && turn > 1) {
                data.turnSummary += "By doing so, he sweeped the board and gained 50 bonus points,";
            }
            if (turn % 2 == 1) {
                if (App.myRole == 'Host')
                    data.turnSummary = App.Host.opponentName + data.turnSummary +'\n It is now your turn.';
                else data.turnSummary = "You" + data.turnSummary + '\n It is now ' + App.Player.opponentName + "'s turn to play";
            } else {
                if (App.myRole == 'Host')
                    data.turnSummary = "You" + data.turnSummary + '\n It is now ' + App.Host.opponentName + "'s turn to play";
                else data.turnSummary = App.Player.opponentName + data.turnSummary + '\n It is now your turn.';
            }
            $('#turnSummary').text(data.turnSummary);
            if (turn >= 49) {
                endgame();
                $('#player1 .score').text(calculateScore(PFPile, true));
                $('#player0 .score').text(calculateScore(PSPile, true));
                App[App.myRole].gameOver();         //CONTINUE FROM HERE
                return;
            }
            nextPlayer();
            if (turn%2 == 1) {
                App[App.myRole].showCards(true);
            } else {
                App[App.myRole].showCards(false);
            }
        },


        onNewGame : function() {
            IO.socket.emit("quitGame", App.gameId);
            window.location.reload();
        },

        onRestart : function() {
            App.restart = true;
            IO.socket.emit("restartRequested", App.gameId);
        },

        restartGame : function() {
            if (App.restart == true && App.opponentRestart == true) {
                App.restart = false;
                App.opponentRestart = false;

                PFCards = [];
                PSCards = [];
                PFPile = [];
                PSPile = [];
                stagePiles = [];
                turn = 1;
                errormessage = "";
                firstTurnSelectedCard = -1;

                deck = [];
                tempStage = [];
                topCard = 0;
                lastPickup = 0;

                PFpoints = 0;
                PSpoints = 0;

                if (App.myRole == "Host")
                    App.Host.gameCountdown();
                else {
                    App.$gameArea.html(App.$templateMainGame);
                    $('#player1 .profile')
                    .html(App.Player.opponentName);

                    $('#player0 .profile')
                    .html(App.Player.myName);

                }

            } else if (App.restart == true && App.opponentRestart == false) {
                App.opponentRestart = true;
                $("#restartBtn").hide();
            } else if (App.restart == false) {
                App.opponentRestart = true;
            }
            
        },



        /* *******************************
           *         HOST CODE           *
           ******************************* */
        Host : {

            myName : '',

            myScore : 0,

            opponentName: '',

            
            

            /**
             * Flag to indicate if a new game is starting.
             * This is used after the first game ends, and players initiate a new game
             * without refreshing the browser windows.
             */
            isNewGame : false,

            /**
             * Keep track of the number of players that have joined the game.
             */
            numPlayersInRoom: 0,

            /**
             * A reference to the correct answer for the current round.
             */
            currentCorrectAnswer: '',

            /**
             * Handler for the "Start" button on the Title Screen.
             */
            onCreateClick: function () {
                // console.log('Clicked "Create A Game"');
                IO.socket.emit('hostCreateNewGame');
            },

            /**
             * The Host screen is displayed for the first time.
             * @param data{{ gameId: int, mySocketId: * }}
             */
            gameInit: function (data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;

                App.Host.displayNewGameScreen();
                // console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId);
            },

            /**
             * Show the Host screen containing the game URL and unique game ID
             */
            displayNewGameScreen : function() {
                // Fill the game screen with the appropriate HTML
                App.$gameArea.html(App.$templateNewGame);

                // Display the URL on screen
                $('#gameURL').text(window.location.href);
                //App.doTextFit('#gameURL');

                // Show the gameId / room id on screen
                $('#spanNewGameCode').text(App.gameId);
            },

            onAcceptClick : function() {
                var hostName = $('#hostName').val() || 'anonymous';
                App.Host.myName = hostName;
                var data = {
                    gameId : App.gameId,
                    playerName : hostName
                };
                App.players.push(data);
                $('#btnEnteredHostName').hide();
                $('#hostNameInfo').hide();
                $('title').text("Sweep - " + hostName);
            },

            /**
             * Update the Host screen when the first player joins
             * @param data{{playerName: string}}
             */
            updateWaitingScreen: function(data) {
                // If this is a restarted game, show the screen.
                if ( App.Host.isNewGame ) {
                    App.Host.displayNewGameScreen();
                }
                // Update host screen
                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player ' + data.playerName + ' joined the game.');


                // Increment the number of players in the room
                App.Host.numPlayersInRoom += 1;

                // Prepare the game screen with new HTML
                //App.$gameArea.html(App.$templateMainGame);

                // Display the players' names on screen
                App.Host.opponentName = data.playerName;

                var newData = {
                    gameId : App.gameId,
                    hostName : App.Host.myName
                };

                console.log(newData);

                IO.socket.emit('hostRoomFull', newData);

                console.log("is this happening!");
            },

            /**
             * Show the countdown screen
             */
            gameCountdown : function() {

                // Prepare the game screen with new HTML
                App.$gameArea.html(App.$templateMainGame);

                // Display the players' names on screen
                $('#player1 .profile')
                    .html(App.Host.myName);

                $('#player0 .profile')
                    .html(App.Host.opponentName);
                // Set the Score section on screen to 0 for each player.
                /*$('#player1Score').find('.score').attr('id',App.Host.players[0].mySocketId);
                $('#player2Score').find('.score').attr('id',App.Host.players[1].mySocketId);
                */

                //IO.socket.emit("hostCountdownFinished", App.gameId);
                App.Host.scriptStarted();
            },


            scriptStarted : function() {
                createDeck();
                do {
                    deckShuffle();
                    initialDeal();
                    console.log(PFCards[0].rank + " " + PFCards[1].rank + " "
                        + PFCards[2].rank + " " + PFCards[3].rank);
                } while (!containsHighCard(PFCards))

                var data = {
                    gameId : App.gameId,
                    PFCards : PFCards,
                    stagePiles : stagePiles
                };
                IO.socket.emit("initialDealOccured", data);
            },

            showFirstStage : function(data) {
                $('#player1 .score').text(calculateScore(PFPile, false));
                $('#player0 .score').text(calculateScore(PSPile, false));
                for (var i = 0; i < stagePiles.length; i++) {
                    if (stagePiles[i].cards.length == 1) {
                        $('#stage').append(cardEle(stagePiles[i].cards[0].rank, stagePiles[i].cards[0].suit, i));
                    } else {
                        $('#stage').append(pileEle(stagePiles[i].rankValue, i));
                    }
                }
                $('#hand').empty();
                for (var i = 0; i < PFCards.length; i++) {
                    $('#hand').append(cardEle(PFCards[i].rank, PFCards[i].suit, i));
                }


                $('.button').hide();
                $('#stage').addClass('hidden');

                $('#selectBtn').click(function(event) {
                    // Check if a card is selected
                    if (! $('#hand .selected')
                        || PFCards[$('#hand .selected').data().index].rank < 9) {
                        console.log('ERROR');
                    } else {
                        firstTurnSelectedCard = $('#hand .selected').data().index;
                        var data = {
                            gameId : App.gameId,
                            firstTurnSelectedCard : $('#hand .selected').text()
                        };
                        $('#stage').removeClass('hidden');
                        $('#hand .selected').removeClass("selected");
                        $('#selectBtn').hide();
                        IO.socket.emit("firstTurnCardSelected", data);
                    }
                });
            },


            showCards : function(HostTurnBool) {
                $('.player').removeClass('current');
                $('#player' + turn % 2).addClass('current');
                $('#stage').empty();
                $('#player1 .score').text(calculateScore(PFPile, false));
                $('#player0 .score').text(calculateScore(PSPile, false));
                for (var i = 0; i < stagePiles.length; i++) {
                    if (stagePiles[i].cards.length == 1) {
                        $('#stage').append(cardEle(stagePiles[i].cards[0].rank, stagePiles[i].cards[0].suit, i));
                    } else {
                        $('#stage').append(pileEle(stagePiles[i].rankValue, i));
                    }
                }
                $('#hand').empty();
                for (var i = 0; i < PFCards.length; i++) {
                    $('#hand').append(cardEle(PFCards[i].rank, PFCards[i].suit, i));
                }
                if (!HostTurnBool) {
                    $('#hand').addClass('unclickable');
                    $('#stage').addClass('unclickable');
                } else {
                    if ($('#hand').hasClass('unclickable'))
                        $('#hand').removeClass('unclickable');
                    if ($('#stage').hasClass('unclickable'))
                        $('#stage').removeClass('unclickable');
                }
            },

            /**
             * Check the answer clicked by a player.
             * @param data{{round: *, playerId: *, answer: *, gameId: *}}
             */
            checkAnswer : function(data) {
                // Verify that the answer clicked is from the current round.
                // This prevents a 'late entry' from a player whos screen has not
                // yet updated to the current round.
                if (data.round === App.currentRound){

                    // Get the player's score
                    var $pScore = $('#' + data.playerId);

                    // Advance player's score if it is correct
                    if( App.Host.currentCorrectAnswer === data.answer ) {
                        // Add 5 to the player's score
                        $pScore.text( +$pScore.text() + 5 );

                        // Advance the round
                        App.currentRound += 1;

                        // Prepare data to send to the server
                        var data = {
                            gameId : App.gameId,
                            round : App.currentRound
                        }

                        // Notify the server to start the next round.
                        IO.socket.emit('hostNextRound',data);

                    } else {
                        // A wrong answer was submitted, so decrement the player's score.
                        $pScore.text( +$pScore.text() - 3 );
                    }
                }
            },


            /**
             * All 10 rounds have played out. End the game.
             * @param data
             */
            gameOver : function() {
                if (parseInt($('#player1 .score').text()) > parseInt($('#player0 .score').text())) {
                    sweetAlert("Congratulations!", "Your Score: " + $('#player1 .score').text() + "\nOpponent Score: "
                        + $('#player0 .score').text(), "success");
                } else if (parseInt($('#player1 .score').text()) < parseInt($('#player0 .score').text())) {
                    sweetAlert("Oh no!", "Your Score: " + $('#player1 .score').text() + "\nOpponent Score: "
                        + $('#player0 .score').text(), "error");
                } else {
                    sweetAlert("It's a draw...", "Your Score: " + $('#player1 .score').text() + "\nOpponent Score: "
                        + $('#player0 .score').text(), "info");
                }
                $(".button").hide();
                $("#restart").show();
                $("#restartBtn").show();
                $("#newGameBtn").show();
            },

            /**
             * A player hit the 'Start Again' button after the end of a game.
             */
            restartGame : function() {
                App.$gameArea.html(App.$templateNewGame);
                $('#spanNewGameCode').text(App.gameId);
            }
        },


        /* *****************************
           *        PLAYER CODE        *
           ***************************** */

        Player : {

            /**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The player's name entered on the 'Join' screen.
             */
            myName: '',

            opponentName: '',

            myScore: 0,

            /**
             * Click handler for the 'JOIN' button
             */
            onJoinClick: function () {
                // console.log('Clicked "Join A Game"');

                // Display the Join Game HTML on the player's screen.
                App.$gameArea.html(App.$templateJoinGame);
            },

            /**
             * The player entered their name and gameId (hopefully)
             * and clicked Start.
             */
            onPlayerStartClick: function() {
                // console.log('Player clicked "Start"');

                // collect data to send to the server
                var data = {
                    gameId : +($('#inputGameId').val()),
                    playerName : $('#inputPlayerName').val() || 'anonymous'
                };

                App.players.push(data);
                $('title').text("Sweep - " + data.playerName);

                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);

                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
            },

            /**
             *  Click handler for the Player hitting a word in the word list.
             */
            onPlayerAnswerClick: function() {
                // console.log('Clicked Answer Button');
                var $btn = $(this);      // the tapped button
                var answer = $btn.val(); // The tapped word

                // Send the player info and tapped word to the server so
                // the host can check the answer.
                var data = {
                    gameId: App.gameId,
                    playerId: App.mySocketId,
                    answer: answer,
                    round: App.currentRound
                }
                IO.socket.emit('playerAnswer',data);
            },

            /**
             *  Click handler for the "Start Again" button that appears
             *  when a game is over.
             */
            onPlayerRestart : function() {
                var data = {
                    gameId : App.gameId,
                    playerName : App.Player.myName
                }
                IO.socket.emit('playerRestart',data);
                App.currentRound = 0;
                $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            },

            /**
             * Display the waiting screen for player 1
             * @param data
             */
            updateWaitingScreen : function(data) {
                if(IO.socket.socket.sessionid === data.mySocketId){
                    App.myRole = 'Player';
                    App.gameId = data.gameId;

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
                }
            },

            /**
             * Display 'Get Ready' while the countdown timer ticks down.
             * @param hostData
             */
            gameCountdown : function(hostData) {
                App.Player.hostSocketId = hostData.mySocketId;
                // Prepare the game screen with new HTML
                App.$gameArea.html(App.$templateMainGame);

                App.Player.opponentName = hostData.hostName;

                // Display the players' names on screen
                $('#player1 .profile')
                    .html(hostData.hostName);

                $('#player0 .profile')
                    .html(App.Player.myName);
            },

            /**
             * Show the list of words for the current round.
             * @param data{{round: *, word: *, answer: *, list: Array}}
             */
            showFirstStage : function(data) {
                console.log("showFirstStage happening");
                $('#player1 .score').text(calculateScore(data.PFPile, false));
                var PSPileOther = [];
                $('#player0 .score').text(calculateScore(PSPileOther, false));
                for (var i = 0; i < data.stagePiles.length; i++) {
                    if (data.stagePiles[i].cards.length == 1) {
                        $('#stage').append(cardEle(data.stagePiles[i].cards[0].rank, data.stagePiles[i].cards[0].suit, i));
                    } else {
                        $('#stage').append(pileEle(data.stagePiles[i].rankValue, i));
                    }
                }
                $('#hand').empty();
                $('.button').hide();
                $('#stage').addClass('hidden');
            },


            unHideFirstStagePlayer : function(data) {
                $('#stage').removeClass('hidden');
                $('#turnSummary').text(App.Player.opponentName + " has picked a "
                    + data.firstTurnSelectedCard.slice(0, 1) + " to make");
            },


            showCards : function(HostTurnBool) {
                $('.player').removeClass('current');
                $('#player' + turn % 2).addClass('current');
                $('#stage').empty();
                $('#player1 .score').text(calculateScore(PFPile, false));
                $('#player0 .score').text(calculateScore(PSPile, false));
                for (var i = 0; i < stagePiles.length; i++) {
                    if (stagePiles[i].cards.length == 1) {
                        $('#stage').append(cardEle(stagePiles[i].cards[0].rank, stagePiles[i].cards[0].suit, i));
                    } else {
                        $('#stage').append(pileEle(stagePiles[i].rankValue, i));
                    }
                }
                $('#hand').empty();
                for (var i = 0; i < PSCards.length; i++) {
                    $('#hand').append(cardEle(PSCards[i].rank, PSCards[i].suit, i));
                }
                if (HostTurnBool) {
                    $('#hand').addClass('unclickable');
                    $('#stage').addClass('unclickable');
                } else {
                    if ($('#hand').hasClass('unclickable'))
                        $('#hand').removeClass('unclickable');
                    if ($('#stage').hasClass('unclickable'))
                        $('#stage').removeClass('unclickable');
                }
            },

            /**
             * Show the "Game Over" screen.
             */
            gameOver : function() {
                if (parseInt($('#player0 .score').text()) > parseInt($('#player1 .score').text())) {
                    sweetAlert("Congratulations!", "Your Score: " + $('#player0 .score').text() + "\nOpponent Score: "
                        + $('#player1 .score').text(), "success");
                } else if (parseInt($('#player0 .score').text()) < parseInt($('#player1 .score').text())) {
                    sweetAlert("Oh no!", "Your Score: " + $('#player0 .score').text() + "\nOpponent Score: "
                        + $('#player1 .score').text(), "error");
                } else {
                    sweetAlert("It's a draw...", "Your Score: " + $('#player0 .score').text() + "\nOpponent Score: "
                        + $('#player1 .score').text(), "info");
                }
                $(".button").hide();
                $("#restart").show();
                $("#restartBtn").show();
                $("#newGameBtn").show();
            }
        },


        /* **************************
                  UTILITY CODE
           ************************** */

        /**
         * Display the countdown timer on the Host screen
         *
         * @param $el The container element for the countdown timer
         * @param startTime
         * @param callback The function to call when the timer ends.
         */
        countDown : function( $el, startTime, callback) {

            // Display the starting time on the screen.
            $el.text(startTime);
            //App.doTextFit('#hostWord');

            // console.log('Starting Countdown...');

            // Start a 1 second timer
            var timer = setInterval(countItDown,1000);

            // Decrement the displayed timer value on each 'tick'
            function countItDown(){
                startTime -= 1
                $el.text(startTime);
                //App.doTextFit('#hostWord');

                if( startTime <= 0 ){
                    // console.log('Countdown Finished.');

                    // Stop the timer and do the callback.
                    clearInterval(timer);
                    callback();
                    return;
                }
            }

        },

        /**
         * Make the text inside the given element as big as possible
         * See: https://github.com/STRML/textFit
         *
         * @param el The parent element of some text
         */
        // doTextFit : function(el) {
        //     textFit(
        //         $(el)[0],
        //         {
        //             alignHoriz:true,
        //             alignVert:false,
        //             widthOnly:true,
        //             reProcess:true,
        //             maxFontSize:300
        //         }
        //     );
        // }

    };

    IO.init();
    App.init();

}($));
