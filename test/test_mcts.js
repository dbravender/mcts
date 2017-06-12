// @flow
/* eslint-env mocha */
'use strict'

declare function describe(name: string, test: any): void;
declare function it(name: string, test: any): void;

var _ = require('lodash')
var assert = require('assert')
var mcts = require('../mcts/index.js')
var MCTS = mcts.MCTS
var RandomSelection = mcts.RandomSelection
var games = require('./games')
var SingleCellGame = games.SingleCellGame
var TwoCellGame = games.TwoCellGame
var TicTacToeGame = games.TicTacToeGame
var SummingDiceGame = games.SummingDiceGame

describe('mcts', function () {
  it('should return one option when only one is returned for a state', function () {
    var mcts = new MCTS(new SingleCellGame())
    assert.deepEqual(mcts.selectMove(), 0)
  })
  it('should always select the winning option when there are two options', function () {
    var mcts = new MCTS(new TwoCellGame())
    assert.equal(mcts.selectMove(), 1)
  })
  it('should favor the winning move in a game of Tic Tac Toe', function () {
    var tictactoegame = new TicTacToeGame()
    var mcts = new MCTS(tictactoegame, 1000, 'X')
    tictactoegame.board = [['O', 'O', null],
                           ['X', 'X', null],
                           ['O', 'O', null]]
    assert.deepEqual(mcts.selectMove(), [1, 2])
  })
  it('should block the winning move in a game of Tic Tac Toe', function () {
    var tictactoegame = new TicTacToeGame()
    var mcts = new MCTS(tictactoegame, 1000, 'X')
    tictactoegame.board = [[null, null, 'O'],
                           [null, 'O', null],
                           [null, null, null]]
    assert.deepEqual(mcts.selectMove(), [2, 0])
  })
  it('should randomly select moves instead of consulting the UCB for RandomSelection moves', function () {
    var summingdicegame = new SummingDiceGame()
    var mcts = new MCTS(summingdicegame, 100, 1)
    assert.equal(mcts.selectMove(), 2)
    var rootNode = mcts.rootNode
    let children = rootNode ? rootNode.getChildren() : null
    if (children) {
      assert.equal(children[0].randomNode, true)
    } else {
      throw new Error('rootNode undefined')
    }
  })
})

describe('RandomElement', function () {
  it('should initialize an array based on its first parameter', function () {
    var rs = new RandomSelection([0, 1, 2, 3])
    assert.deepEqual(rs.array, [0, 1, 2, 3])
  })
})
