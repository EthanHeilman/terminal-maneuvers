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
      this.startingFuel = 7;
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
  
    laserAI2() {
      if (this.state.round === 5) {
        return Math.floor(Math.random() * (this.state.fuelLeft+1));
      }
  
      let usefulGuesses = [];
      for (let fuelSpent = 0;  fuelSpent < this.settings.hitTable[this.state.round - 1].length; fuelSpent++) {
        const missProb = this.settings.hitTable[this.state.round - 1][fuelSpent];
        // No point in guessing a value that is always safe for the missile
        if (missProb > 1) {
          if (fuelSpent <= this.state.fuelLeft - this.state.roundsLeft + 1) {
            usefulGuesses.push(fuelSpent);
          }
        }
      }
    }
  
    laserAIAlways2() {
      return 2;
    }
  
    missileAIRand() {
      const x = this.state.fuelLeft - this.state.roundsLeft + 2;
      return Math.floor(Math.random() * x);
    }

    missileAI() {
      let x = this.state.fuelLeft - this.state.roundsLeft + 1;
      if (this.state.round === 1) {
          x = Math.min(2, x);
          }
      if (this.state.round === 2) {
          x = Math.min(3, x);
      }
      if (this.state.round === 3) {
          x = Math.min(4, x);
      }
      if (this.state.round === 4) {
          x = Math.min(5, x);
      }
      if (this.state.round === 5) {
          x = Math.min(6, x);
      }
      return Math.floor(Math.random() * (x+1));
    }
  
    missileAIMid() {
      const x = this.state.fuelLeft - this.state.roundsLeft + 2;
      if (this.state.round === 1) {
        return 1;
      }
      if (this.state.round === 2) {
        return 1;
        // return Math.floor(Math.random() * Math.min(1, x));
        // return 3;
      }
      if (this.state.round === 3) {
        return 1;
        // return Math.floor(Math.random() * Math.min(2, x));
      }
      if (this.state.round === 4) {
        return 1;
        // return Math.floor(Math.random() * Math.min(2, x));
      }
      if (this.state.round === 5) {
        return 2;
        // return Math.floor(Math.random() * this.state.fuelLeft);
      }
    }
  
    missileAIHigh() {
      // return Math.max(1, this.missileAI());
      return 2;
    }
  
    missileAIGPT() {
      // Compute a suggested upper bound: 
      //   "fuelLeft - roundsLeft + 2"
      // so we can burn at least 1 each round (if possible).
      let x = this.state.fuelLeft - this.state.roundsLeft + 2;
    
      // Never let x drop below 1 when we still have fuel 
      // (avoid spending 0 unless forced).
      x = Math.max(1, x);
    
      // Also ensure we don't exceed the actual fuel left
      x = Math.min(x, this.state.fuelLeft);
    
      // If we somehow have no fuel or x ≤ 0, must spend 0
      if (x <= 0) {
        return 0;
      }
    
      // Randomly pick from 0..(x-1) inclusive
      return Math.floor(Math.random() * x);
    }
    
  }
  
  function runWithAI(missileAI, laserAI) {
    const settings = new Settings();
    const game = new Game(settings);
    let result = Game.TURN_RESULT.NO_WINNER;
  
    let laserWins = 0;
    let missileWins = 0;
  
    for (let i = 0; i < 100000; i++) {
      const settings = new Settings();
      const game = new Game(settings);
      let result = Game.TURN_RESULT.NO_WINNER;
  
      while (result === Game.TURN_RESULT.NO_WINNER) {
        let laserMove = laserAI(game);
        let missileMove = missileAI(game);
        result = game.turn(missileMove, laserMove);
        if (result === Game.TURN_RESULT.MISSILE_WINS) {
          missileWins++;
        }
        if (result === Game.TURN_RESULT.LASER_WINS) {
          laserWins++;
        }
      }
    }
  
    console.log("Laser wins", laserWins, "Missile wins", missileWins, "Ratio", missileWins/(laserWins + missileWins));
  }
  
  function test() {
    // runWithAI((game) => game.missileAI(), (game) => game.laserAI());
    // runWithAI((game) => game.missileAI(), (game) => game.laserAI2());
    // runWithAI((game) => game.missileAIMid(), (game) => game.laserAI());
    // runWithAI((game) => game.missileAIMid(), (game) => game.laserAI2());
    // runWithAI((game) => game.missileAIGPT(), (game) => game.laserAI());
    // runWithAI((game) => game.missileAIGPT(), (game) => game.laserAI2());
    // runWithAI((game) => game.missileAIHigh(), (game) => game.laserAI());
    // runWithAI((game) => game.missileAIHigh(), (game) => game.laserAI2());
    // runWithAI((game) => game.missileAIHigh(), (game) => game.laserAIAlways2());
    }
  
  function test2() {
    let laserWins = 0;
    let missileWins = 0;
  
    for (let i = 0; i < 100000; i++) {
      const settings = new Settings();
      const game = new Game(settings);
      let result = Game.TURN_RESULT.NO_WINNER;
  
      while (result === Game.TURN_RESULT.NO_WINNER) {
        let laserMove = game.laserAI();
        let missileMove = game.missileAIMid();
        // let missileMove = game.missileAI();
        result = game.turn(missileMove, laserMove);
        if (result === Game.TURN_RESULT.MISSILE_WINS) {
          missileWins++;
        }
        if (result === Game.TURN_RESULT.LASER_WINS) {
          laserWins++;
        }
      }
    }
    console.log("Laser wins", laserWins, "Missile wins", missileWins, "Ratio", missileWins/(laserWins + missileWins));
  }
  
  
  test();