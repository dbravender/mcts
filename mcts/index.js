/*jslint nomen: true */
/*jslint indent: 2 */
'use strict';

var _ = require('lodash');

function Node(game, parent, move, depth, mcts) {
  this.game = game;
  this.mcts = mcts;
  this.parent = parent;
  this.move = move;
  this.wins = 0;
  this.visits = 0;
  this.children = null;
  this.depth = depth || 0;
}

Node.prototype.getUCB1 = function () {
  // See https://en.wikipedia.org/wiki/Monte_Carlo_tree_search#Exploration_and_exploitation
  return (this.wins / this.visits) + Math.sqrt(2 * Math.log(this.parent.visits) / this.visits);
};

Node.prototype.getChildren = function () {
  if (this.children === null) {
    if (this.move !== null) {
      this.game.performMove(this.move);
    }
    this.children = _.map(this.game.getPossibleMoves(), function (move) {
      return new Node(_.assign(new this.game.constructor(), _.cloneDeep(this.game)), this, move, this.depth + 1, this.mcts);
    }, this);
  }
  return this.children;
};

Node.prototype.getWinner = function () {
  // forces the move to be performed
  this.getChildren();
  return this.game.getWinner();
};

Node.prototype.nextMove = function () {
  return _(this.getChildren()).sortBy(this.mcts.nodeSort).last();
};

function MCTS(game, rounds, player) {
  var self = this;
  this.game = game;
  this.nodeSort = function (node) {
    if (node.parent.game.getCurrentPlayer() === self.player) {
      return node.getUCB1();
    }
    return node.visits;
  };
  this.rounds = rounds || 1000;
  this.player = player || 0;
  this.rootNode = new Node(game, null, null, 0, this);
}

MCTS.prototype.selectMove = function () {
  var round, currentNode;
  for (round = 0; round < this.rounds; round += 1) {
    currentNode = this.rootNode;
    this.rootNode.visits += 1;
    while (!_.isEmpty(currentNode.getChildren())) {
      currentNode = currentNode.nextMove();
      currentNode.visits += 1;
    }
    if (this.player === currentNode.getWinner()) {
      while (currentNode.parent) {
        currentNode.wins += 1;
        currentNode = currentNode.parent;
      }
    }
  }
  return _(this.rootNode.getChildren()).sortBy('visits').last().move;
};

exports.MCTS = MCTS;