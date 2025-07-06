
function createRoom() {
console.log('creating room...')
const name = document.getElementById("hostName").value;
socket.emit("host", { name });
}

socket.on("roomCreated", ({ room, players }) => {
document.getElementById(
    "roomInfo"
).textContent = `Room Code: ${room}`;
updatePlayerList(players);
});

socket.on("playerJoined", ({ room, players }) => {
        updatePlayerList(players);
      });
socket.on("roomClosed", () => alert("Room closed"));

function updatePlayerList(players) {
const ul = document.getElementById("players");
ul.innerHTML = "";
for (let id in players) {
    const li = document.createElement("li");
    li.textContent = players[id].playerName;
    ul.appendChild(li);
}
}

function startGame() {
  const roomText = document.getElementById("roomInfo").textContent;
  const roomCode = roomText.split(": ")[1];
  socket.emit("startGame", { roomCode });
}

function startCallingNumber(){
    const roomText = document.getElementById("roomInfo").textContent;
    const roomCode = roomText.split(": ")[1];
    socket.emit('callNumber', ({ roomCode }));
}

socket.on("gameInfo", ({ info }) => {
  console.log(info);
});

socket.on("gameStarted", ({ yourCard }) => {
  console.log("Your Bingo card:", yourCard);
});


let called = [];

socket.on("numberCalled", ({ number, allNumbers }) => {
  called = allNumbers;
  document.getElementById("calledNumbers").textContent =
    `Numbers Called: ${called.join(", ")}`;
});

socket.on("noMoreNumbers", () => {
  alert("All 75 numbers have been called! Game Over.");
});


socket.on("playerLeft", ({ playerName, players }) => {
  alert(`${playerName} has left the room.`);
  updatePlayerList(players);
});

socket.on("bingoSuccess", ({ winner, winners }) => {
  alert(`${winner} has BINGO! 🎉`);
  // Update score list or UI if needed
});

socket.on("bingoFailed", ({ message }) => {
  alert(message);
});


function bingo(){
    const roomText = document.getElementById("roomInfo").textContent;
    const roomCode = roomText.split(": ")[1]; 
    socket.emit("bingoClaim", { roomCode });

}