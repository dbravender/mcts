/*jslint nomen: true*/
/*jslint bitwise: true */
/*jslint indent: 2 */
'use strict';

var _ = require('lodash');
var RandomSelection = require('../mcts/index.js').RandomSelection;

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

SingleCellGame.prototype.getCurrentPlayer = function () {
  return 0;
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

TwoCellGame.prototype.getCurrentPlayer = function () {
  return this.currentPlayer;
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

TicTacToeGame.prototype.getCurrentPlayer = function () {
  return this.currentPlayer;
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

function SummingDiceGame() {
  this.currentPlayer = 1;
  this.round = 0;
  this.score = 0;
}

SummingDiceGame.prototype.getPossibleMoves = function () {
  switch (this.round) {
  case 0:
    return [0, 1, 2];
  case 1:
    if (this.diceToRoll === 0) {
      return new RandomSelection([]);
    }
    if (this.diceToRoll === 1) {
      return new RandomSelection([1, 2, 3, 4, 5, 6]);
    }
    return new RandomSelection([2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7,
                                7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 9, 9, 9, 9, 10,
                                10, 10, 11, 11, 12]);
  }
  return [];
};

SummingDiceGame.prototype.getCurrentPlayer = function () {
  return 1;
};

SummingDiceGame.prototype.performMove = function (move) {
  switch (this.round) {
  case 0:
    this.diceToRoll = move;
    break;
  case 1:
    this.score += move;
    break;
  }
  this.round += 1;
};

SummingDiceGame.prototype.getWinner = function () {
  if (this.score > 5) {
    return 1;
  }
};

exports.SingleCellGame = SingleCellGame;
exports.TwoCellGame = TwoCellGame;
exports.TicTacToeGame = TicTacToeGame;
exports.SummingDiceGame = SummingDiceGame;
