class State {
  constructor() {
    this.roundsLeft = -1;
    this.round = -1;
    this.fuelLeft = -1;
    this.missileMoves = [];
    this.laserMoves = [];
    this.rolls = [];
    this.currentPlayer = "none";
  }
}

class Settings {
  constructor() {
    this.rounds = 5; // length of game in rounds
    this.startingFuel = 6;
    this.fuelChoices = [0, 1, 2, 3, 4, 5, 6];
  }

  hitFunct(round, fuelSpent) {
    console.assert(round > 0);

    // 1 - always misses
    // 2 - roll d6: 2+ laser misses
    // 3 - roll d6: 3+ laser misses
    // ...
    // 7 - always hits
    const hitTable = [
      [7, 2, 1, 1, 1, 1, 1], // Round 1
      [7, 3, 2, 1, 1, 1, 1],
      [7, 4, 3, 2, 1, 1, 1],
      [7, 5, 4, 3, 2, 1, 1],
      [7, 6, 5, 4, 3, 2, 1], // Round 5
    ];

    const needsToBeat = hitTable[round - 1][fuelSpent];
    const roll = Math.floor(Math.random() * 6) + 1;

    return { hit: roll < needsToBeat, roll };
  }

  missilePlayer(state) {
    return 0;
  }

  laserPlayer(state) {
    return 0;
  }
}

class Game {
  constructor(settings) {
    this.state = new State();
    this.settings = settings;
    this.state.roundsLeft = settings.rounds;
    this.state.round = 1;
    this.state.fuelLeft = settings.startingFuel;
  }

  static TURN_RESULT = {
    MISSILE_WINS: 'missile-wins',
    LASER_WINS: 'laser-wins',
    NO_WINNER: 'no-winner',
  };

  turn(missileMove, laserMove) {
    this.state.missileMoves.push(missileMove);
    this.state.laserMoves.push(laserMove);

    let hit = false;
    if (missileMove === laserMove) {
      let hitResult = this.settings.hitFunct(this.state.round, missileMove);
      this.state.rolls.push(hitResult.roll);
      hit = hitResult.hit;
    } else {
      this.state.rolls.push(-1);
    }

    this.state.fuelLeft -= missileMove;
    this.state.roundsLeft--;
    this.state.round++;

    if (hit || this.state.fuelLeft < 0) {
      return Game.TURN_RESULT.LASER_WINS;
    }
    if (this.state.roundsLeft === 0) {
      return Game.TURN_RESULT.MISSILE_WINS;
    }
    return Game.TURN_RESULT.NO_WINNER;
  }
}

let game;
let playerRole = null;
let computerRole = null;

const statusDiv = document.getElementById("status");
const roundsLeftSpan = document.getElementById("rounds-left");
const missileFuelSpan = document.getElementById("missile-fuel");
const laserHandDiv = document.getElementById("laser-hand");
const missileHandDiv = document.getElementById("missile-hand");
const cardsDiv = document.getElementById("cards");
const missileCardsDiv = document.getElementById("missile-cards");

const fuelInput = document.getElementById("fuel-input");
const burnFuelButton = document.getElementById("burn-fuel");
const gameBoard = document.getElementById("game-board");

document.getElementById("play-as-laser").onclick = () => startGame("Laser");
document.getElementById("play-as-missile").onclick = () => startGame("Missile");

function startGame(role) {
  const settings = new Settings();
  game = new Game(settings);

  playerRole = role;
  computerRole = role === "Laser" ? "Missile" : "Laser";
  document.getElementById("player-select").style.display = "none";
  document.getElementById("game-container").style.display = "block";
  initializeBoard();
  if (playerRole === "Laser") {
    laserHandDiv.style.display = "block";
    missileHandDiv.style.display = "none";
    updateLaserHand();
  } else {
    missileHandDiv.style.display = "block";
    laserHandDiv.style.display = "none";
    updateMissileHand();
  }
  updateStatus(`You are playing as ${playerRole}.`);
}

function initializeBoard() {
  gameBoard.innerHTML = "";
  const headers = ["Round", "Pay 0", "Pay 1", "Pay 2", "Pay 3", "Pay 4", "Pay 5", "Pay 6"];
  headers.forEach((header) => {
    const cell = document.createElement("div");
    cell.className = "cell header";
    cell.textContent = header;
    gameBoard.appendChild(cell);
  });

  for (let round = 1; round <= game.settings.rounds; round++) {
    for (let column = 0; column < 6 + 2; column++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (column === 0) {
        cell.textContent = `Round ${round}`;
      }
      gameBoard.appendChild(cell);
    }
  }
}

function updateStatus(message) {
  statusDiv.textContent = message;
}

function updateMissileHand() {
  missileCardsDiv.innerHTML = "";
  for (let card = 0; card <= game.state.fuelLeft; card++) {
      const cardDiv = document.createElement("div");
      cardDiv.className = "card";
      cardDiv.textContent = card;
      cardDiv.onclick = () => playMissileCard(card);
      missileCardsDiv.appendChild(cardDiv);
  }
}

function updateLaserHand() {
  cardsDiv.innerHTML = "";
  for (let card = 0; card <= game.state.fuelLeft; card++) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.textContent = card;
    cardDiv.onclick = () => playLaserCard(card);
    cardsDiv.appendChild(cardDiv);
  }
}


function disableCards() {
  const cardElements = document.querySelectorAll(".card");
  cardElements.forEach((el) => el.classList.add("disabled"));
}

function recordAction(state, fuelBurned, laserGuess) {
  let round = state.round -1;
  const cells = Array.from(gameBoard.children);
  const roundRow = round * 8;
  console.log(round, roundRow, round, fuelBurned, laserGuess);

  if (fuelBurned === laserGuess) {
    cells[roundRow + fuelBurned + 1].textContent = `Missile & Laser`;
  } else {
    cells[roundRow + fuelBurned + 1].textContent = `Missile`;
    cells[roundRow + laserGuess + 1].textContent = `Laser`;
  }
}

function playLaserCard(card) {
  disableCards();
  updateStatus(`You guessed ${card}. Missile is deciding...`);
  setTimeout(() => {
    if (computerRole === "Missile") {
      const missileMove = Math.floor(Math.random() * (game.state.fuelLeft + 1));
      const result = game.turn(missileMove, card);
      missileFuelSpan.textContent = game.state.fuelLeft;
      recordAction(game.state, missileMove, card);
      checkRoundResult(result);
    }
  }, 800);
}

function playMissileCard(card) {
  disableCards();
  updateStatus(`You guessed ${card}. Laser is deciding...`);
  const fuelBurned = parseInt(card, 10);
  const laserGuess = Math.floor(Math.random() * game.state.fuelLeft);

  if (isNaN(fuelBurned) || fuelBurned < 0 || fuelBurned > game.state.fuelLeft) {
    alert("Invalid fuel amount!");
    updateStatus("Laser wins!");
    endGame("Laser wins!");
    return;
  }
  missileFuelSpan.textContent = game.state.fuelLeft;

  setTimeout(() => {
      const result = game.turn(fuelBurned, laserGuess);
      recordAction(game.state, fuelBurned, laserGuess);
      checkRoundResult(result);
  }, 800);
}

function checkRoundResult(result) {
  if (result === Game.TURN_RESULT.LASER_WINS) {
    updateStatus("Laser wins!");
    endGame("Laser wins!");
  } else if (result === Game.TURN_RESULT.MISSILE_WINS) {
    updateStatus("Missile wins!");
    endGame("Missile wins!");
  } else {
    updateStatus("Next round!");
    if (playerRole === "Laser") {
      updateLaserHand();
    } else {
      updateMissileHand();
    }
  }
}

function endGame(message) {
  updateStatus(message);
  disableCards();
}
