/**
 * Test suite for MCTS implementation
 */

import assert from 'assert';
import { MCTS, RandomSelection } from './index';
import {
  SingleCellGame,
  TwoCellGame,
  TicTacToeGame,
  SummingDiceGame,
} from './games';

describe('mcts', () => {
  it('should return one option when only one is returned for a state', () => {
    const mcts = new MCTS(new SingleCellGame());
    assert.deepStrictEqual(mcts.selectMove(), 0);
  });

  it('should always select the winning option when there are two options', () => {
    const mcts = new MCTS(new TwoCellGame());
    assert.strictEqual(mcts.selectMove(), 1);
  });

  it('should favor the winning move in a game of Tic Tac Toe', () => {
    const tictactoegame = new TicTacToeGame();
    const mcts = new MCTS(tictactoegame, 5000);
    tictactoegame.board = [
      ['O', 'O', null],
      ['X', 'X', null],
      ['O', 'O', null],
    ];
    assert.deepStrictEqual(mcts.selectMove(), [1, 2]);
  });

  it('should block the winning move in a game of Tic Tac Toe', () => {
    const tictactoegame = new TicTacToeGame();
    const mcts = new MCTS(tictactoegame, 5000);
    tictactoegame.board = [
      [null, null, 'O'],
      [null, 'O', null],
      [null, null, null],
    ];
    assert.deepStrictEqual(mcts.selectMove(), [2, 0]);
  });

  it('should randomly select moves instead of consulting the UCB for RandomSelection moves', () => {
    const summingdicegame = new SummingDiceGame();
    const mcts = new MCTS(summingdicegame, 100);
    assert.strictEqual(mcts.selectMove(), 2);
  });
});

describe('RandomElement', () => {
  it('should initialize an array based on its first parameter', () => {
    const rs = new RandomSelection([0, 1, 2, 3]);
    assert.deepStrictEqual(rs.array, [0, 1, 2, 3]);
  });
});
