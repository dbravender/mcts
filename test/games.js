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

exports.SingleCellGame = SingleCellGame;
exports.TwoCellGame = TwoCellGame;