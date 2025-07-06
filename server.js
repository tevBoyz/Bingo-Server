const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "http://127.0.0.1:5500", // Your Live Server origin
    methods: ["GET", "POST"]
  }
});


//Utils Imports
const { playerJoin, getCurrentPlayer, playerLeave, getRoomPlayers} = require('./utils/players');
const { generateBingoCard, checkBingo } = require('./utils/bingo');

//Global Variables
  const roomCards = {};
  let calledNumbers = {};
  let callIntervals = {};
  let claimedWinners = {}; // roomCode -> array of winners
  let gameState = {}; //Track the state of a room idle | playing 


// Serve static files
app.use(express.static('public'));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Connected to: ' + socket.id);

  // socket.emit('connect', {success: true})
  
  function sid(id){
    return String(id);
  }

  //Create room
  socket.on('host',({name}) =>{
    let roomCode = generateRoomCode();

    gameState[roomCode] = 'idle'; //State idle for newly created room

    const player = playerJoin(socket.id, name, roomCode)

    socket.join(roomCode);

    socket.emit('roomCreated', {room: roomCode, players: getRoomPlayers(roomCode)});

    socket.emit('updatePlayers', {players: getRoomPlayers(roomCode)});

    })

  socket.on('joinRoom', ({player, room}) => {
    
      console.log(player, room)
      const players = getRoomPlayers(room);

        if(!players){
          socket.emit('joinError', 'Room does not exist');
        }

      const playerN = playerJoin(socket.id, player, room);

      socket.join(room);

      socket.to(room).emit('playerJoined', {room: room, players: getRoomPlayers(room)});

      io.to(room).emit('playerJoined', {room:room, players: getRoomPlayers(room)});
    

  });

  socket.on('startGame', ({ roomCode }) => {
  const players = getRoomPlayers(roomCode);

  if (!players || players.length <= 1)
  {
    console.log("No players Joined the group")
    return;
  }

  // Generate cards per player
  if(!roomCards[roomCode])roomCards[roomCode] = {}; // store cards under roomCode
  players.forEach(player => {
    const card = generateBingoCard();
    playerId = String(player.id);
    roomCards[roomCode][playerId] = card;

    // Send card to individual player
    io.to(player.id).emit('gameStarted', {
      message: 'Game started!',
      yourCard: card,
      roomCode: roomCode,
    });
  });

  gameState[roomCode] = 'playing';
  // Inform all players
  io.to(roomCode).emit('gameInfo', {
    info: `Bingo game started! Cards sent.`,
  });

});


  socket.on('callNumber', ({ roomCode }) => {
    console.log("called callNumber")
  if (callIntervals[roomCode]) return; // prevent multiple intervals

  calledNumbers[roomCode] = new Set();

  callIntervals[roomCode] = setInterval(() => {
    if (calledNumbers[roomCode].size >= 75) {
      clearInterval(callIntervals[roomCode]);
      io.to(roomCode).emit('noMoreNumbers');
      return;
    }

    let nextNumber;
    do {
      nextNumber = Math.floor(Math.random() * 75) + 1;
    } while (calledNumbers[roomCode].has(nextNumber));

    calledNumbers[roomCode].add(nextNumber);
    
    io.to(roomCode).emit('numberCalled', {
      number: nextNumber,
      allNumbers: Array.from(calledNumbers[roomCode]),
    });
  }, 5000); // every 5 seconds
});


  socket.on('bingoClaim', ({ roomCode }) => {
  console.log("claim initiated");
  const player = getCurrentPlayer(socket.id);

  console.log("bingo called by" + player);

  const playerCard = roomCards[roomCode]?.[String(player.id)];

  const called = calledNumbers[roomCode] || new Set();

  console.log("Player:", player);
  console.log("Card:", playerCard);
  console.log("Called Numbers:", called);

  if (!player || !playerCard) return;

  // const hasBingo = checkBingo(playerCard, called);
  const hasBingo = checkBingo(playerCard, Array.from(called));

  console.log(hasBingo)

  if (hasBingo) {
    // gameState[roomCode] = 'idle';
    if (!claimedWinners[roomCode]) claimedWinners[roomCode] = [];

    // Avoid duplicate winners
    const alreadyWon = claimedWinners[roomCode].some(p => p.id === socket.id);
    if (!alreadyWon) {
      claimedWinners[roomCode].push({
        id: socket.id,
        name: player.playerName
      });

      io.to(roomCode).emit('bingoSuccess', {
        winner: player.playerName,
        winners: claimedWinners[roomCode]
      });
    }
  } else {
    socket.emit('bingoFailed', { message: "Nice try! But no Bingo yet 😅" });
  }
});

//Restart a game
socket.on('restartGame', ({ roomCode }) => {
  const players = getRoomPlayers(roomCode);
  if (!players || players.length === 0) {
    socket.emit('error', { message: "No players in the room to restart the game." });
    return;
  }

  // Clear previous state
  clearInterval(callIntervals[roomCode]);
  delete callIntervals[roomCode];
  delete calledNumbers[roomCode];
  delete claimedWinners[roomCode];
  roomCards[roomCode] = {}; // reset cards

  // Generate and send new cards
  players.forEach(player => {
    const card = generateBingoCard();
    roomCards[roomCode][String(player.id)] = card;

    io.to(player.id).emit('gameRestarted', {
      message: 'Game restarted!',
      yourCard: card,
    });
  });

  gameState[roomCode] = 'playing';

  // Notify the entire room
  io.to(roomCode).emit('gameInfo', {
    info: 'Game has been restarted! New cards have been dealt.',
  });

  console.log(`Game restarted for room ${roomCode}`);
});

//Handle player disconnects
socket.on('disconnect', () => {
  const player = playerLeave(socket.id);

  if (player) {
    const { room } = player;
    console.log(`${player.playerName} disconnected from ${room}`);

    // Notify others in the room
    socket.to(room).emit('playerLeft', {
      playerName: player.playerName,
      players: getRoomPlayers(room),
    });

    // Optionally: if host left, clean up room
    // For now, we'll just log it
    const remainingPlayers = getRoomPlayers(room);
    if (remainingPlayers.length === 0) {
      console.log(`Room ${room} is now empty. Cleaning up...`);
      clearInterval(callIntervals[room]);
      delete callIntervals[room];
      delete calledNumbers[room];
      delete roomCards[room];
    }
  }
});

//Connection code end
});

// Start server
const PORT = 3000;
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

function generateRoomCode(){
  //create room code randomly
  return Math.random().toString(36).substring(2, 8);
}

// Example cleanup if needed
function clearRoom(roomCode) {
  clearInterval(callIntervals[roomCode]);
  delete callIntervals[roomCode];
  delete calledNumbers[roomCode];
  delete roomCards[roomCode];
}
