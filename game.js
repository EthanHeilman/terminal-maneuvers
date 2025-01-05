
class GameBoardUI {
  constructor() {
    this.game;
    this.playerRole = null;
    this.computerRole = null;

    this.statusDiv = document.getElementById("status");
    this.roundsLeftSpan = document.getElementById("rounds-left");
    this.missileFuelSpan = document.getElementById("missile-fuel");
    
    this.fuelInput = document.getElementById("fuel-input");
    this.burnFuelButton = document.getElementById("burn-fuel");
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
    this.updateStatus(`You are playing as ${this.playerRole}.`);
  }

  initializeBoard() {
    this.gameBoard.innerHTML = "";

    const numColumns = this.game.settings.rounds + 1;
    const numRows = this.game.settings.fuelChoices.length-1;

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
    // 9. Make laser look like a target crosshairs
    // XXX 10. Get clickable cells to work for laser and missile
    // XXX 11. Delete disabled cards
    // 12. Have method for setting up the next round
    // 13. Make missile explode when hit
    // 14. Add effect for laser firing
    // 15. Missile or crosshairs appear when moving over a cell
    // 16. Draw path of missile
    // 17. Add icon for ship that laser is on
    // 18. Ship icon explodes when laser hits it
    // 19. Invert probabilities, so it shows missile hit chance
    // 20. Disable board and announce winner
    // 21. Add new game button
    // 22. Clear up gross calls into game state
    // XXX 23. Pull CSS out of HTML
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
          this.CreateCell(round, fuel);
        }
      }
    }
  }

  updateStatus(message) {
    this.statusDiv.innerHTML += message + "<br>";
    this.statusDiv.scrollTop = this.statusDiv.scrollHeight;
  }


  // Turn off all clickable blinking cells
  setAllCellsToNonClickable() {
    // TODO: replace this.game.settings.rounds and this.game.settings.fuelChoices.length with a simple function call
    for (let round = 0; round < this.game.settings.rounds; round++) {
      for (let card = 0; card < this.game.settings.fuelChoices.length; card++) {
        console.log("111", 
          this.game.settings.fuelChoices.length, this.game.state.round, round, card);

        if ((this.game.settings.fuelChoices.length-1) < card) { 
          console.log("222");
          continue;
        }
        const cell = document.getElementById(`cell-${round+1}-${card}`);
        this.RemoveBlinkToCell(cell, card);
      }
    }
  }

  updateMissileHand() {
    this.setAllCellsToNonClickable();

    for (let card = 0; card <= this.game.state.fuelLeft; card++) {
      console.log("updateLaserHand", this.game.settings.fuelChoices.length, this.game.state.round, card);

      if ((this.game.settings.fuelChoices.length-1) < card) { continue;}

      console.log("zxc");

      const cell = document.getElementById(`cell-${this.game.state.round}-${card}`);
      this.AddBlinkToCell(cell, () => this.playMissileCard(card));
    }
  }

  updateLaserHand() {
    this.setAllCellsToNonClickable();
    for (let card = 0; card <= this.game.state.fuelLeft; card++) {
      console.log("updateLaserHand", this.game.settings.fuelChoices.length, this.game.state.round, card);

      if ((this.game.settings.fuelChoices.length-1) < card) { continue;}

      const cell = document.getElementById(`cell-${this.game.state.round}-${card}`);
      this.AddBlinkToCell(cell, () => this.playLaserCard(card));
    }
  }

  recordAction(state, fuelBurned, laserGuess) {
    this.missileFuelSpan.textContent = this.game.state.fuelLeft;
    this.roundsLeftSpan.textContent = this.game.state.roundsLeft;

    const cells = Array.from(this.gameBoard.children);
    const numColumns = this.game.settings.rounds + 1;

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

  playLaserCard(card) {
    setTimeout(() => {
      if (this.computerRole === "Missile") {
        const missileMove = this.game.missileAI();
        console.log("missileMove AI:", missileMove);

        const result = this.game.turn(missileMove, card);
        this.recordAction(this.game.state, missileMove, card);
        this.checkRoundResult(result);
      }
    }, 100);
  }

  playMissileCard(card) {
    const fuelBurned = parseInt(card, 10);

    const laserGuess = this.game.laserAI();
    console.log("laserGuess AI:", laserGuess);
    this.missileFuelSpan.textContent = this.game.state.fuelLeft;

    setTimeout(() => {
        const result = this.game.turn(fuelBurned, laserGuess);
        this.recordAction(this.game.state, fuelBurned, laserGuess);
        this.checkRoundResult(result);
    }, 100);
  }

    checkRoundResult(result) {
      const missileMove = this.game.state.missileMoves[this.game.state.missileMoves.length-1];
      const laserMove = this.game.state.laserMoves[this.game.state.laserMoves.length-1];

      if (missileMove === laserMove) {
        if (result === Game.TURN_RESULT.LASER_WINS) {
          if (this.game.state.rolls[this.game.state.round-2] === 7) {
            this.updateStatus(`Missile moved to ${missileMove}, Laser guessed ${laserMove} and hit automatically`);
          } else {
            this.updateStatus(`Missile moved to ${missileMove}, Laser guessed ${laserMove} and hit on a roll of ${this.game.state.rolls[this.game.state.round-2]} (miss required ${this.game.settings.hitTable[this.game.state.round-2][missileMove]}+)`);
          }
        } else {
          this.updateStatus(`Missile moved to ${missileMove}, Laser guessed ${laserMove} and missed on roll of ${this.game.state.rolls[this.game.state.round-2]} (miss required ${this.game.settings.hitTable[this.game.state.round-2][missileMove]}+)`);
        }
      } else {
        this.updateStatus(`Missile moved to ${missileMove}, Laser guessed ${laserMove}`);
      }

    if (result === Game.TURN_RESULT.LASER_WINS) {
      this.endGame("Laser wins!");
    } else if (result === Game.TURN_RESULT.MISSILE_WINS) {
      this.endGame("Missile wins!");
    } else {
      if (this.playerRole === "Laser") {
        this.updateLaserHand();
      } else {
        this.updateMissileHand();
      }
    }
  }

  endGame(message) {
    this.updateStatus(message);
  }


  CreateCell(round, fuel) {
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

  AddBlinkToCell(cell, onClickFunction) {
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

  RemoveBlinkToCell(cell, fuel) {
    // Don't add blink to this cell as it is not playable
    if (cell.style.backgroundColor === "black") {
      return;
    }

    const blinkBorder = cell.querySelector('.blink-border');
    if (blinkBorder) {
      blinkBorder.style.display = 'none';
    }

    cell.onclick = null;
  }
}

let gameBoardUI = new GameBoardUI();