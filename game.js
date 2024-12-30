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
    // 1 - always misses
    // 2 - roll d6: 2+ laser misses
    // 3 - roll d6: 3+ laser misses
    // ...
    // 7 - always hits
    this.hitTable = [
      [7, 2, 1, 1, 1, 1, 1], // Round 1
      [7, 3, 2, 1, 1, 1, 1],
      [7, 4, 3, 2, 1, 1, 1],
      [7, 5, 4, 3, 2, 1, 1],
      [7, 6, 5, 4, 3, 2, 1], // Round 5
    ];
  }

  hitFunct(round, fuelSpent) {
    console.assert(round > 0);
    const needsToBeat = this.hitTable[round - 1][fuelSpent];
    const roll = Math.floor(Math.random() * 6) + 1;

    return { hit: roll < needsToBeat, roll };
  }

  hitTableText(round, fuelSpent) {
    if (7 === this.hitTable[round - 1][fuelSpent]) {
      return "Always hits";
    } else if (1 === this.hitTable[round - 1][fuelSpent]) {
      return "Always safe";
    } else {
      return `Safe on ${this.hitTable[round - 1][fuelSpent]}+`;
    }
  }

  // This checks if a move would burn fuel without and additional evasion benefit.
  // For instance if burning 2 fuel is always a miss, then burning 3 fuel is always a worse move.
  wastefulMove(round, fuelSpent) {
      return fuelSpent > 0 && this.hitTableText(round, fuelSpent-1) === "Always safe";
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

  laserAI() {
    let usefulGuesses = [];
    for (let fuelSpent = 0;  fuelSpent < this.settings.hitTable[this.state.round - 1].length; fuelSpent++) {
      const missProb = this.settings.hitTable[this.state.round - 1][fuelSpent];

      console.log("LaserAI", fuelSpent, this.state.fuelLeft, this.state.fuelLeft - this.state.roundsLeft + 1, fuelSpent <= this.state.fuelLeft - this.state.roundsLeft + 1, missProb, usefulGuesses);

      // No point in guessing a value that is always safe for the missile
      if (missProb > 1) {
        if (fuelSpent <= this.state.fuelLeft - this.state.roundsLeft + 1) {
          usefulGuesses.push(fuelSpent);
        }
      }
    }

    // This can happen if the missile burns all its fuel. The missile loses the game on the next turn.
    if (usefulGuesses.length === 0) {
      return 0;
    } else {
      const randomIndex = Math.floor(Math.random() * usefulGuesses.length);
      return usefulGuesses[randomIndex];
    }
  }

  missileAI() {
    const x = game.state.fuelLeft - game.state.roundsLeft + 2;
    console.log("missileAI", x, this.state.fuelLeft, this.state.fuelLeft - this.state.roundsLeft + 1);
    return Math.floor(Math.random() * x);
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

  const numColumns = game.settings.rounds + 1;
  const numRows = game.settings.fuelChoices.length-1;

  console.log("numColumns", numColumns, "numRows", numRows);

  // TODO: list
  // XXX 1. Flip board
  // XXX 2. Write roll to output
  // XXX 3. write transcript to output
  // 4. Move cards to clicking on board
  // 5. Show blinking possible moves on the board
  // XXX 6. Put missile and lasers are icons on the board
  // 7. Make missile and laser icons look like a missile or a laser
  gameBoard.style.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
  for (let col = 0; col < numColumns; col++) {
    const header = document.createElement("div");
    header.className = "cell header";
    if (col === 0) {
      header.textContent = "Fuel Cost";
    } else {
      header.textContent = `Round ${col}`;
    }
    gameBoard.appendChild(header);
  }

  for (let row = 0; row <= numRows; row++) {
    for (let col = 0; col < numColumns; col++) {
      const fuel = row;
      const round = col;

      if (col === 0) {
        const header = document.createElement("div");
        header.className = "cell header";
        header.textContent = `Pay ${fuel}`;
        gameBoard.appendChild(header);
      } else {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.textContent = game.settings.hitTableText(round, fuel);

        if (game.settings.wastefulMove(round, fuel)) {
            cell.style.backgroundColor = "black";
        }
        gameBoard.appendChild(cell);
      }
    }
  }
}

function updateStatus(message) {
  statusDiv.innerHTML += message + "<br>";
  statusDiv.scrollTop = statusDiv.scrollHeight;
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
  missileFuelSpan.textContent = game.state.fuelLeft;
  roundsLeftSpan.textContent = game.state.roundsLeft;

  const cells = Array.from(gameBoard.children);
  const numColumns = game.settings.rounds + 1;

  const missilePos = numColumns * (fuelBurned + 1) + state.round - 1;
  const laserPos = numColumns * (laserGuess + 1) + state.round - 1;

  const missileCell = cells[missilePos];
  const laserCell = cells[laserPos];

  // Create new missile icon
  const newMissileIcon = document.createElement("div");
  newMissileIcon.className = "missile";
  newMissileIcon.textContent = "🚀";
  missileCell.appendChild(newMissileIcon);

  // Create new laser icon
  const newLaserIcon = document.createElement("div");
  newLaserIcon.className = "laser";
  laserCell.appendChild(newLaserIcon);

  // Offset icons if they share the same cell
  if (missilePos === laserPos) {
    newMissileIcon.style.top = "6px"; // Offset by 5px
    newMissileIcon.style.left = "6px"; // Offset by 5px
    newLaserIcon.style.top = "-6px"; // Offset by -5px
    newLaserIcon.style.left = "-6px"; // Offset by -5px
  }
}

function playLaserCard(card) {
  disableCards();

  setTimeout(() => {
    if (computerRole === "Missile") {
      const missileMove = game.missileAI();
      const result = game.turn(missileMove, card);
      recordAction(game.state, missileMove, card);
      checkRoundResult(result);
    }
  }, 800);
}

function playMissileCard(card) {
  disableCards();
  const fuelBurned = parseInt(card, 10);

  const laserGuess = game.laserAI();
  missileFuelSpan.textContent = game.state.fuelLeft;

  setTimeout(() => {
      const result = game.turn(fuelBurned, laserGuess);
      recordAction(game.state, fuelBurned, laserGuess);
      checkRoundResult(result);
  }, 800);
}

function checkRoundResult(result) {
    const missileMove = game.state.missileMoves[game.state.missileMoves.length-1];
    const laserMove = game.state.laserMoves[game.state.laserMoves.length-1];

    if (missileMove === laserMove) {
      if (result === Game.TURN_RESULT.LASER_WINS) {
        if (game.state.rolls[game.state.round-2] === 7) {
          updateStatus(`Missile moved to ${missileMove}, Laser guessed ${laserMove} and hit automatically`);
        } else {
          updateStatus(`Missile moved to ${missileMove}, Laser guessed ${laserMove} and hit on a roll of ${game.state.rolls[game.state.round-2]} (miss required ${game.settings.hitTable[game.state.round-2][missileMove]}+)`);
        }
      } else {
        updateStatus(`Missile moved to ${missileMove}, Laser guessed ${laserMove} and missed on roll of ${game.state.rolls[game.state.round-2]} (miss required ${game.settings.hitTable[game.state.round-2][missileMove]}+)`);
      }
    } else {
      updateStatus(`Missile moved to ${missileMove}, Laser guessed ${laserMove}`);
    }

  if (result === Game.TURN_RESULT.LASER_WINS) {
    endGame("Laser wins!");
  } else if (result === Game.TURN_RESULT.MISSILE_WINS) {
    endGame("Missile wins!");
  } else {
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
