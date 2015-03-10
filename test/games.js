/*jslint nomen: true*/
/*jslint bitwise: true */
/*jslint indent: 2 */
'use strict';

function SingleCellGame() {
  // First player to play always wins
  this.board = [null];
  this.currentPlayer = 0;
}

SingleCellGame.prototype.getPossibleMoves = function () {
  if (this.board[0] === null) {
    return [0];
  }
  return [];
};

SingleCellGame.prototype.performMove = function (move) {
  this.board[move] = 0;
};

SingleCellGame.prototype.getWinner = function () {
  return this.board[0];
};

function TwoCellGame() {
  // Player that plays in the 2nd cell always wins
  this.board = [null, null];
  this.currentPlayer = 0;
}

TwoCellGame.prototype.getPossibleMoves = function () {
  var i, available = [];
  for (i = 0; i < 2; i += 1) {
    if (this.board[i] === null) {
      available.push(i);
    }
  }
  return available;
};

TwoCellGame.prototype.performMove = function (move) {
  this.board[move] = this.currentPlayer;
  this.currentPlayer += 1;
  this.currentPlayer = this.currentPlayer % 2;
};

TwoCellGame.prototype.getWinner = function () {
  return this.board[1];
};

function TicTacToeGame() {
  this.board = [[null, null, null],
                [null, null, null],
                [null, null, null]];
  // See http://jsfiddle.net/5wKfF/249/
  this.boardScore = [[1,    2,   4],
                     [8,   16,  32],
                     [64, 128, 256]];
  this.winningScores = [7, 56, 448, 73, 146, 292, 273, 84];
  this.currentPlayer = 'X';
}

TicTacToeGame.prototype.getPossibleMoves = function () {
  var y, x, available = [];
  if (this.getWinner() !== null) {
    return [];
  }
  for (y = 0; y < 3; y += 1) {
    for (x = 0; x < 3; x += 1) {
      if (this.board[y][x] === null) {
        available.push([y, x]);
      }
    }
  }
  return available;
};

TicTacToeGame.prototype.performMove = function (move) {
  this.board[move[0]][move[1]] = this.currentPlayer;
  this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
};

TicTacToeGame.prototype.getWinner = function () {
  var y, x, i, p, player, playerScores = {X: 0, O: 0};
  for (y = 0; y < 3; y += 1) {
    for (x = 0; x < 3; x += 1) {
      if (this.board[y][x] !== null) {
        playerScores[this.board[y][x]] += this.boardScore[y][x];
      }
    }
  }
  for (p = 0; p < 2; p += 1) {
    player = ['X', 'O'][p];
    for (i = 0; i < this.winningScores.length; i += 1) {
      if ((this.winningScores[i] & playerScores[player]) === this.winningScores[i]) {
        return player;
      }
    }
  }
  return null;
};

exports.SingleCellGame = SingleCellGame;
exports.TwoCellGame = TwoCellGame;
exports.TicTacToeGame = TicTacToeGame;