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
    var mcts2 = new MCTS(new TwoCellGame());
    assert.equal(mcts2.selectMove(), 1);
  });
});