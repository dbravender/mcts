/*jslint nomen: true*/
/*jslint indent: 2 */
/*global describe, it */
'use strict';

var _ = require('lodash');
var assert = require('assert');
var MCTS = require('../mcts/app.js').MCTS;
var games = require('./games');
var SingleCellGame = games.SingleCellGame;
var TwoCellGame = games.TwoCellGame;
var TicTacToeGame = games.TicTacToeGame;

describe('mcts', function () {
  it('should return one option when only one is returned for a state', function () {
    var mcts = new MCTS(new SingleCellGame());
    assert.deepEqual(mcts.selectMove(), 0);
  });
  it('should always select the winning option when there are two options', function () {
    var mcts = new MCTS(new TwoCellGame());
    assert.equal(mcts.selectMove(), 1);
  });
  it('should favor the winning move in a game of Tic Tac Toe', function () {
    var tictactoegame = new TicTacToeGame(),
      mcts = new MCTS(tictactoegame, 1000, 'X');
    tictactoegame.board = [['O',   'O', null],
                           ['X',   'X', null],
                           ['O',   'O', null]];
    assert.deepEqual(mcts.selectMove(), [1, 2]);
  });
  it('should block the winning move in a game of Tic Tac Toe', function () {
    var tictactoegame = new TicTacToeGame(),
      mcts = new MCTS(tictactoegame, 1000, 'X');
    tictactoegame.board = [[null, null,  'O'],
                           [null,  'O', null],
                           [null, null, null]];
    assert.deepEqual(mcts.selectMove(), [2, 0]);
  });
});