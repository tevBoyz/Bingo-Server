const players = [];

//Join player to chat
function playerJoin(id, playerName, room) {
  const player = { id: id, playerName: playerName,room: room};
  players.push(player);
  return player;
}

function checkID(id){
  let existes = false;
  players.find(player => player.id === id ? existes = true : existes = false);
  return existes;
}

//Get current player
function getCurrentPlayer(id) {
  return players.find(player => player.id === id);
}

//player leaves chat
function playerLeave(id) {
  const index = players.findIndex(player => player.id === id);
  if (index !== -1) {
    return players.splice(index, 1)[0];
  }
}

//Get room players
function getRoomPlayers(room) {
  return players.filter(player => player.room === room);
}

module.exports = {
  playerJoin,
  getCurrentPlayer,
  playerLeave,
  getRoomPlayers,
  checkID
};