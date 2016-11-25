// @flow
'use strict'

var RandomSelection = require('../mcts/index.js').RandomSelection

class SingleCellGame {
  board: Array<?number>
  currentPlayer: number
  constructor () {
    // First player to play always wins
    this.board = [null]
    this.currentPlayer = 0
  }
  getPossibleMoves () {
    if (this.board[0] === null) {
      return [0]
    }
    return []
  }

  performMove (move: number) {
    this.board[move] = 0
  }

  getCurrentPlayer () {
    return 0
  }

  getWinner () {
    return this.board[0]
  }
}

class TwoCellGame {
  board: Array<?number>
  currentPlayer: number
  constructor () {
    // Player that plays in the 2nd cell always wins
    this.board = [null, null]
    this.currentPlayer = 0
  }

  getPossibleMoves () {
    var i
    var available = []
    for (i = 0; i < 2; i += 1) {
      if (this.board[i] === null) {
        available.push(i)
      }
    }
    return available
  }

  performMove (move: number) {
    this.board[move] = this.currentPlayer
    this.currentPlayer += 1
    this.currentPlayer = this.currentPlayer % 2
  }

  getCurrentPlayer () {
    return this.currentPlayer
  }

  getWinner () {
    return this.board[1]
  }
}

type TicTacToePlayer =
| 'X'
| 'O';

class TicTacToeGame {
  board: Array<Array<?TicTacToePlayer>>
  boardScore: Array<Array<number>>
  winningScores: Array<number>
  currentPlayer: TicTacToePlayer
  constructor () {
    this.board = [[null, null, null],
                  [null, null, null],
                  [null, null, null]]
    // See http://jsfiddle.net/5wKfF/249/
    this.boardScore = [[1, 2, 4],
                       [8, 16, 32],
                       [64, 128, 256]]
    this.winningScores = [7, 56, 448, 73, 146, 292, 273, 84]
    this.currentPlayer = 'X'
  }

  getPossibleMoves () {
    var y
    var x
    var available = []
    if (this.getWinner() !== null) {
      return []
    }
    for (y = 0; y < 3; y += 1) {
      for (x = 0; x < 3; x += 1) {
        if (this.board[y][x] === null) {
          available.push([y, x])
        }
      }
    }
    return available
  }

  performMove (move: Array<number>) {
    this.board[move[0]][move[1]] = this.currentPlayer
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X'
  }

  getCurrentPlayer () {
    return this.currentPlayer
  }

  getWinner () {
    var player
    var playerScores = {X: 0, O: 0}
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        if (this.board[y][x] != null) {
          playerScores[this.board[y][x]] += this.boardScore[y][x]
        }
      }
    }
    for (let p = 0; p < 2; p += 1) {
      player = ['X', 'O'][p]
      for (let i = 0; i < this.winningScores.length; i += 1) {
        if ((this.winningScores[i] & playerScores[player]) === this.winningScores[i]) {
          return player
        }
      }
    }
    return null
  }
}

class SummingDiceGame {
  currentPlayer: number
  round: number
  score: number
  diceToRoll: number
  constructor () {
    this.currentPlayer = 1
    this.round = 0
    this.score = 0
  }

  getPossibleMoves () {
    switch (this.round) {
      case 0:
        return [0, 1, 2]
      case 1:
        if (this.diceToRoll === 0) {
          return new RandomSelection([])
        }
        if (this.diceToRoll === 1) {
          return new RandomSelection([1, 2, 3, 4, 5, 6])
        }
        return new RandomSelection([2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7,
                                    7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 9, 9, 9, 9, 10,
                                    10, 10, 11, 11, 12])
    }
    return []
  }

  getCurrentPlayer () {
    return 1
  }

  performMove (move: number) {
    switch (this.round) {
      case 0:
        this.diceToRoll = move
        break
      case 1:
        this.score += move
        break
    }
    this.round += 1
  }

  getWinner () {
    if (this.score > 5) {
      return 1
    }
  }
}

exports.SingleCellGame = SingleCellGame
exports.TwoCellGame = TwoCellGame
exports.TicTacToeGame = TicTacToeGame
exports.SummingDiceGame = SummingDiceGame
