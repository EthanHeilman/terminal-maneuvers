// Messages:
const WAITING_ON_MISSILE_PLAYER = "Waiting on Human player (Missile)...";
const WAITING_ON_LASER_PLAYER = "Waiting on Human player (laser)...";
const WAITING_ON_AI = "Waiting on AI to move...";

const MISSILE_WINS = "MISSILE WINS!";
const LASER_WINS = "LASER WINS!";

class GameBoardUI {

  constructor() {
    this.game;
    this.playerRole = null;
    this.computerRole = null;

    this.transcriptDiv = document.getElementById("transcript");
    this.statusDiv = document.getElementById("status");
    this.roundsLeftSpan = document.getElementById("rounds-left");
    this.missileFuelSpan = document.getElementById("missile-fuel");
    
    this.gameBoard = document.getElementById("game-board");
    
    document.getElementById("play-as-laser").onclick = () => this.startGame("Laser");
    document.getElementById("play-as-missile").onclick = () => this.startGame("Missile");
  }

  startGame(role) {
    const settings = new Settings();
    this.game = new Game(settings);

    this.playerRole = role;
    this.computerRole = role === "Laser" ? "Missile" : "Laser";
    document.getElementById("player-select").style.display = "none";
    document.getElementById("game-container").style.display = "block";

    this.initializeBoard();
    if (this.playerRole === "Laser") {
      this.updateLaserHand();
    } else {
      this.updateMissileHand();
    }
    this.updateTranscript(`You are playing as ${this.playerRole}.`);
  }

  initializeBoard() {
    this.missileFuelSpan.textContent = this.game.state.fuelLeft;
    this.roundsLeftSpan.textContent = this.game.state.roundsLeft;

    this.gameBoard.innerHTML = "";

    const numColumns = this.game.settings.rounds + 1;
    const numRows = this.game.settings.startingFuel-1;

    console.log("numColumns", numColumns, "numRows", numRows);

    // TODO: list
    // XXX 1. Flip board
    // XXX 2. Write roll to output
    // XXX 3. write transcript to output
    // XXX 4. Move cards to clicking on board
    // XXX 5. Show blinking possible moves on the board
    // XXX 6. Put missile and lasers are icons on the board
    // XXX 7. Make missile and laser icons look like a missile or a laser
    // XXX 8. Convert game UI to class
    // XXX 9. Make laser look like a target cross hairs
    // XXX 10. Get clickable cells to work for laser and missile
    // XXX 11. Delete disabled cards
    // XXX 12. Have method for setting up the next round
    // XXX 13. Make missile explode when hit
    // 14. Add effect for laser firing
    // 15. Missile or cross hairs appear when moving over a cell
    // 16. Draw path of missile
    // 17. Add icon for ship that laser is on
    // XXX 18. Ship icon explodes when laser hits it
    // XXX 19. Invert probabilities, so it shows missile hit chance
    // XXX 20. Disable board and announce winner
    // XXX 21. Add new game button
    // XXX 22. Clear up gross calls into game state
    // XXX 23. Pull CSS out of HTML
    // XXX 24. Fix fuel choices
    // XXX 25. Change system delay for AI moves
    // 26. Add link to instructions
    this.gameBoard.style.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
    for (let col = 0; col < numColumns; col++) {
      const header = document.createElement("div");
      header.className = "cell header";
      if (col === 0) {
        header.textContent = "Fuel Cost";
      } else {
        header.textContent = `Round ${col}`;
      }
      this.gameBoard.appendChild(header);
    }

    for (let row = 0; row <= numRows; row++) {
      for (let col = 0; col < numColumns; col++) {
        const fuel = row;
        const round = col;

        if (col === 0) {
          const header = document.createElement("div");
          header.className = "cell header";
          header.textContent = `Pay ${fuel}`;
          this.gameBoard.appendChild(header);
        } else {
          this.createCell(round, fuel);
        }
      }
    }
  }

  updateTranscript(message) {
    this.transcriptDiv.innerHTML += message + "<br>";
    this.transcriptDiv.scrollTop = this.transcriptDiv.scrollHeight;
  }

  updateMissileHand() {
    this.setAllCellsToNonClickable();
    this.statusDiv.textContent = WAITING_ON_MISSILE_PLAYER;
    for (let fuelCost = 0; fuelCost <= this.game.state.fuelLeft; fuelCost++) {
      if (this.game.settings.wastefulMove(this.game.state.round, fuelCost)) { 
        continue;
      }
      const cell = document.getElementById(`cell-${this.game.state.round}-${fuelCost}`);
      this.makeCellClickable(cell, () => this.playMissileCard(fuelCost));
    }
  }

  updateLaserHand() {
    this.setAllCellsToNonClickable();
    this.statusDiv.textContent = WAITING_ON_LASER_PLAYER;
    for (let fuelCost = 0; fuelCost <= this.game.state.fuelLeft; fuelCost++) {
      if (this.game.settings.wastefulMove(this.game.state.round, fuelCost)) { 
        continue;
      }
      const cell = document.getElementById(`cell-${this.game.state.round}-${fuelCost}`);
      this.makeCellClickable(cell, () => this.playLaserCard(fuelCost));
    }
  }

  recordAction(fuelBurned, laserGuess) {
    const cells = Array.from(this.gameBoard.children);
    const numColumns = this.game.settings.rounds + 1;

    const missilePos = numColumns * (fuelBurned + 1) + this.game.state.round;
    const laserPos = numColumns * (laserGuess + 1) + this.game.state.round;

    const missileCell = cells[missilePos];
    const laserCell = cells[laserPos];
    console.log("fuel burned", fuelBurned);
    const result = this.game.turn(fuelBurned, laserGuess);

    this.missileFuelSpan.textContent = this.game.state.fuelLeft;
    this.roundsLeftSpan.textContent = this.game.state.roundsLeft;

    // Create new missile icon
    let newMissileIcon = document.createElement("div");
    newMissileIcon.className = "missile";
    newMissileIcon.textContent = "🚀";
    missileCell.appendChild(newMissileIcon);

    // Create new laser icon
    let newLaserIcon = document.createElement("div");
    newLaserIcon.className = "laser";
    newLaserIcon.textContent = "⊕";
    laserCell.appendChild(newLaserIcon);

    // If they share the same cell
    if (missilePos === laserPos) {
      if (result === Game.TURN_RESULT.LASER_WINS) {
        newLaserIcon.style.left = "5px";
        newMissileIcon.style.left = "5px";
        newMissileIcon.textContent = "💥"; // Turn missile into explosion

        // Create hit
        const hitIcon = document.createElement("div");
        hitIcon.className = "hit";
        hitIcon.textContent = "HIT";
        missileCell.appendChild(hitIcon);

      } else { // Else if miss, offset icons and mark as miss
        newMissileIcon.style.left = "5px";
        newLaserIcon.style.left = "45px";

        const missIcon = document.createElement("div");
        missIcon.className = "miss";
        missIcon.textContent = "MISS";
        missileCell.appendChild(missIcon);
      }
    }
    const missileMove = this.game.state.missileMoves[this.game.state.missileMoves.length-1];
    const laserMove = this.game.state.laserMoves[this.game.state.laserMoves.length-1];

    if (missileMove === laserMove) {
      if (result === Game.TURN_RESULT.LASER_WINS) {
          this.updateTranscript(`HIT in round-${this.game.state.round-1}: Missile=${missileMove}, Laser=${laserMove}`);
      } else {
        this.updateTranscript(`MISS in round-${this.game.state.round-1}: Missile=${missileMove}, Laser=${laserMove}`);
      }
    } else {
      this.updateTranscript(`MISS in round-${this.game.state.round-1}: Missile=${missileMove}, Laser=${laserMove}`);
    }

    if (result === Game.TURN_RESULT.LASER_WINS) {
      this.endGame(result);
    } else if (result === Game.TURN_RESULT.MISSILE_WINS) {
      this.endGame(result);
    } else {
      if (this.playerRole === "Laser") {
        this.updateLaserHand();
      } else {
        this.updateMissileHand();
      }
    }
  }

  playLaserCard(card) {
    this.statusDiv.textContent = WAITING_ON_AI;
    const missileMove = this.game.missileAI();
    this.recordAction(missileMove, card);
  }

  playMissileCard(card) {
    this.statusDiv.textContent = WAITING_ON_AI;
    const fuelBurned = parseInt(card, 10);
    const laserGuess = this.game.laserAI();
    this.recordAction(fuelBurned, laserGuess);
  }

  endGame(result) {
    this.setAllCellsToNonClickable();
    if (result === Game.TURN_RESULT.LASER_WINS) {
      this.statusDiv.textContent = LASER_WINS;
    } else if (result === Game.TURN_RESULT.MISSILE_WINS) {
      this.statusDiv.textContent = MISSILE_WINS;
    }

    const newGameButton = document.createElement("button");
    newGameButton.textContent = "New Game";
    newGameButton.style.marginLeft = "10px";
    newGameButton.onclick = () => location.reload();
    this.statusDiv.appendChild(newGameButton);
  }

  createCell(round, fuel) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.className = "cell solid-border";
    cell.id = `cell-${round}-${fuel}`;

    if (this.game.settings.wastefulMove(round, fuel)) {
      cell.style.backgroundColor = "black";
    } else {  
      const blinkBorder = document.createElement("div");
      blinkBorder.className = "blink-border";
      blinkBorder.style.display = "none"; // Only make the blink visible when making it clickable
      cell.appendChild(blinkBorder);
      
      const internal = document.createElement("div");
      internal.textContent = this.game.settings.hitTableText(round, fuel);
      cell.appendChild(internal); // Append internal directly to cell to make it visible
    }
    this.gameBoard.appendChild(cell);

    return cell;
  }

  makeCellClickable(cell, onClickFunction) {
    // Don't add blink to this cell as it is not playable
    if (cell.style.backgroundColor === "black") {
      return;
    }

    const blinkBorder = cell.querySelector('.blink-border');
    if (blinkBorder) {
      blinkBorder.style.display = 'block';
    }

    cell.onclick = onClickFunction;
  }

  makeCellNotClickable(cell, fuel) {
    const blinkBorder = cell.querySelector('.blink-border');
    if (blinkBorder) {
      blinkBorder.style.display = 'none';
    }
    cell.onclick = null;
  }


  setAllCellsToNonClickable() {
      // Turn off all clickable blinking cells
    for (let round = 0; round < this.game.settings.rounds; round++) {
      for (let fuelCost = 0; fuelCost < this.game.settings.startingFuel; fuelCost++) {
        if ((this.game.settings.startingFuel-1) < fuelCost) { 
          continue;
        }
        const cell = document.getElementById(`cell-${round+1}-${fuelCost}`);
        this.makeCellNotClickable(cell, fuelCost);
      }
    }
  }
}

let gameBoardUI = new GameBoardUI();