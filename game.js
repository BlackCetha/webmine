'use strict';

// DOCUMENTATION: SEE api.txt
var minesweeper = {
  field: [],
  difficulty: null,
  gameState: null,
  gameStateDisplay: null,
  checkMask: [
    [ [-1,-1], [ 0,-1], [ 1,-1] ],
    [ [-1, 0],          [ 1, 0] ],
    [ [-1, 1], [ 0, 1], [ 1, 1] ]
  ],
  openedTiles: null,
  startTime: null,

  startGame: function (difficulty) {
    if (!difficulty) difficulty = 10;
    if (typeof difficulty !== 'number') throw new Error('Invalid difficulty');

    this.difficulty = difficulty;

    this.field = [];
    this.openedTiles = 0;

    // Generate game field
    for (var i = 0; i < difficulty; i++) {
      var line = [];

      for (var c = 0; c < difficulty; c++) {
        line.push({
          isMine: false,
          htmlText: null,
          htmlButton: null,
          neighborMines: null,
          marked: false
        });
      }

      this.field.push(line);
    }

    // Place mines
    for (var i = 0; i < difficulty; i++) {
      var xcoord = this._generateRandomInt(difficulty);
      var ycoord = this._generateRandomInt(difficulty);

      // Check if there is already a mine at that location and repeat
      // if neccessary
      if (this.field[xcoord][ycoord].isMine === true) {
        i--;
      } else {
        this.field[xcoord][ycoord].isMine = true;
      }
    }

    // Calculate neighbor mine count
    for (var xcoord = 0; xcoord < difficulty; xcoord++) {
      for (var ycoord = 0; ycoord < difficulty; ycoord++) {
        var counter = 0;

        for (var i = 0; i < this.checkMask.length; i++) {
          for (var c = 0; c < this.checkMask[i].length; c++) {
            var xcheck = xcoord + this.checkMask[i][c][0];
            var ycheck = ycoord + this.checkMask[i][c][1];

            if (xcheck < 0 || xcheck >= difficulty) continue;
            if (ycheck < 0 || ycheck >= difficulty) continue;

            if (this.field[xcheck][ycheck].isMine === true) counter++;
          }
        }

        this.field[xcoord][ycoord].neighborMines = counter;
      }
    }

    this.drawBoard();

    this.gameState = 1;
    this.updateGameStateDisplay();
  },

  clickTile: function (button) {
    if (this.gameState !== 1 && this.gameState !== 2) return;

    var xcoord = +button.dataset.xcoord;
    var ycoord = +button.dataset.ycoord;

    var tile = this.field[xcoord][ycoord];

    if (tile.marked === true) return;

    if (tile.htmlText.textContent !== '') return;

    if (this.gameState === 1) {
      this.startTime = new Date();

      this.gameState = 2;
      this.updateGameStateDisplay();
    }

    if (tile.isMine === true) {
      tile.htmlText.textContent = 'M';
      button.style.backgroundColor = 'darkred';

      this.gameState = 3;
      this.updateGameStateDisplay();
    } else {
      // One space character to differenciate from unclicked tiles
      tile.htmlText.textContent = (tile.neighborMines === 0) ? ' ' : tile.neighborMines;
      button.style.backgroundColor = 'transparent';

      this.openedTiles++;

      if (this.openedTiles === this.difficulty * this.difficulty - this.difficulty) {
        this.gameState = 3;
        this.updateGameStateDisplay();

        alert('Won in ' + (new Date() - this.startTime)/1000 + 's');
      }

      if (tile.neighborMines === 0) {
        this.revealEmptyTiles(xcoord, ycoord);
      }
    }
  },

  drawBoard: function () {
    var table = document.createElement('table');

    for (var ycoord = 0; ycoord < this.difficulty; ycoord++) {
      var row = document.createElement('tr');

      for (var xcoord = 0; xcoord < this.difficulty; xcoord++) {
        var cell = document.createElement('td');

        cell.style.backgroundColor = 'lightgrey';

        cell.addEventListener('click', function () {
          minesweeper.clickTile(this);
        });

        cell.addEventListener('contextmenu', function (event) {
          event.preventDefault();

          var xcoord = +this.dataset.xcoord;
          var ycoord = +this.dataset.ycoord;

          var tile = minesweeper.field[xcoord][ycoord];

          if (!tile || tile.htmlText.textContent !== '') return;

          if (minesweeper.gameState !== 1 && minesweeper.gameState !== 2) return;

          if (tile.marked === false) {
            tile.marked = true;
            this.style.backgroundColor = 'yellow';
          } else {
            tile.marked = false;
            this.style.backgroundColor = 'lightgrey';
          }
        });

        cell.dataset.xcoord = xcoord;
        cell.dataset.ycoord = ycoord;

        var text = document.createTextNode('');

        cell.append(text);

        this.field[xcoord][ycoord].htmlText = text;
        this.field[xcoord][ycoord].htmlButton = cell;

        row.append(cell);
      }

      table.append(row);
    }

    document.body.innerHTML = '';

    this.gameStateDisplay = document.createTextNode('Loading...');
    document.body.append(this.gameStateDisplay);

    var restartlink = document.createElement('a');
    restartlink.href = 'javascript:minesweeper.startGame()';
    restartlink.append(document.createTextNode('Restart'));

    document.body.append(table);

    document.body.append(restartlink);
  },

  updateGameStateDisplay: function () {
    var enums = [
      "Loading...",
      "Waiting for first move",
      "Live",
      "Over"
    ];

    this.gameStateDisplay.textContent = enums[this.gameState];
  },

  revealEmptyTiles: function (xcoord, ycoord) {
    for (var i = 0; i < this.checkMask.length; i++) {
      for (var c = 0; c < this.checkMask[i].length; c++) {
        var xcheck = xcoord + this.checkMask[i][c][0];
        var ycheck = ycoord + this.checkMask[i][c][1];

        if (xcheck < 0 || xcheck >= this.difficulty) continue;
        if (ycheck < 0 || ycheck >= this.difficulty) continue;

        if (this.field[xcheck][ycheck].htmlText.textContent !== '') continue;

        var tile = this.field[xcheck][ycheck];

        tile.htmlText.textContent = (tile.neighborMines === 0) ? ' ' : tile.neighborMines;
        tile.htmlButton.style.backgroundColor = 'transparent';

        this.openedTiles++;

        if (this.openedTiles === this.difficulty * this.difficulty - this.difficulty) {
          this.gameState = 3;
          this.updateGameStateDisplay();

          alert('Won in ' + Math.trunc((new Date() - this.startTime)/1000) + 's');
        }

        if (tile.neighborMines === 0) {
          this.revealEmptyTiles(xcheck, ycheck);
        }
      }
    }
  },

  _generateRandomInt: function (min, max) {
    if (typeof min !== 'undefined' && !max) {
      max = min;
      min = 0;
    }

    if (typeof min !== 'number' || typeof max !== 'number') throw new Error('Invalid parameters');

    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min)) + min;
  }
};

minesweeper.startGame();
