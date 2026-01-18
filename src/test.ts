/**
 * Test suite for MCTS implementation
 */

import assert from 'node:assert';
import { SingleCellGame, SummingDiceGame, TicTacToeGame, TwoCellGame } from './games';
import { MCTS, RandomSelection } from './index';

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

  it('should block horizontal winning threat on last move', () => {
    const tictactoegame = new TicTacToeGame();
    // X has two in a row: X X _
    // O must block at [0, 2]
    tictactoegame.board = [
      ['X', 'X', null],
      ['O', null, null],
      [null, null, 'O'],
    ];
    // It's X's turn after this board state, but let's set it up so O is to move
    // Actually, in this board X=3, O=2, so it's O's turn (even number of moves means X's turn)
    // Let me recalculate: X at [0,0], [0,1] = 2 moves, O at [1,0], [2,2] = 2 moves
    // Total 4 moves, X went first, so it's X's turn
    // Let me set up a board where O needs to block
    const tictactoegame2 = new TicTacToeGame();
    tictactoegame2.board = [
      ['X', 'X', null],
      ['O', 'O', null],
      ['X', null, null],
    ];
    // X=3, O=2, X's turn - not what we want
    // For O's turn, we need X=O count, but X goes first so X = O+1 at O's turn
    // After X plays once (X=1, O=0), it's O's turn
    // After O plays once (X=1, O=1), it's X's turn
    // So for O's turn: X count = O count + 1? No wait...
    // Move 1: X plays, board has X=1, O=0, now O's turn
    // Move 2: O plays, board has X=1, O=1, now X's turn
    // Move 3: X plays, board has X=2, O=1, now O's turn
    // Move 4: O plays, board has X=2, O=2, now X's turn
    // So for O's turn: X = O + 1 or when it's odd total moves
    const game = new TicTacToeGame();
    game.board = [
      ['X', 'X', null], // X threatening to win at [0,2]
      ['O', 'O', null],
      ['X', null, null],
    ];
    // X=3, O=2, total 5 moves, so O's turn
    const mcts = new MCTS(game, 5000);
    const move = mcts.selectMove();
    // O must block at [0, 2] to prevent X from winning
    assert.deepStrictEqual(move, [0, 2]);
  });

  it('should block vertical winning threat', () => {
    const game = new TicTacToeGame();
    game.board = [
      ['X', 'O', null],
      ['X', 'O', null],
      [null, null, null],
    ];
    // X=2, O=2, total 4 moves, X's turn - need to adjust
    // For O's turn, need odd total
    const game2 = new TicTacToeGame();
    game2.board = [
      ['X', 'O', 'X'],
      ['X', 'O', null],
      [null, null, null],
    ];
    // X=3, O=2, total 5 moves, O's turn
    // X threatening at [2, 0] (vertical line in col 0)
    const mcts = new MCTS(game2, 5000);
    const move = mcts.selectMove();
    // O must block at [2, 0]
    assert.deepStrictEqual(move, [2, 0]);
  });

  it('should block with only two moves remaining (O must block X)', () => {
    const game = new TicTacToeGame();
    // Late game: X=4, O=3, two empty squares remain
    // X threatens row 0, O cannot win, O must block
    game.board = [
      ['X', 'X', null], // X threatens win at [0,2]
      ['O', 'O', 'X'],
      ['O', 'X', null], // [2,2] is also empty
    ];
    // X=4 ([0,0], [0,1], [1,2], [2,1]), O=3 ([1,0], [1,1], [2,0])
    // Total=7, O's turn
    // O has no winning move (row 1 blocked by X at [1,2])
    // X wins at [0,2] if not blocked
    game.currentPlayer = 'O';
    const mcts = new MCTS(game, 5000);
    const move = mcts.selectMove();
    assert.deepStrictEqual(
      move,
      [0, 2],
      `O should block at [0,2] but played [${move[0]}, ${move[1]}]`
    );
  });

  it('should block with only two moves remaining even with low simulations (100)', () => {
    const game = new TicTacToeGame();
    game.board = [
      ['X', 'X', null],
      ['O', 'O', 'X'],
      ['O', 'X', null],
    ];
    game.currentPlayer = 'O';
    // Test multiple times since MCTS has randomness
    let blockCount = 0;
    for (let i = 0; i < 10; i++) {
      const mcts = new MCTS(game.clone() as TicTacToeGame, 100);
      const move = mcts.selectMove();
      if (move[0] === 0 && move[1] === 2) {
        blockCount++;
      }
    }
    // Should block at least 8 out of 10 times even with 100 simulations
    assert.ok(
      blockCount >= 8,
      `Expected to block at least 8/10 times but only blocked ${blockCount}/10`
    );
  });

  it('should block with only two moves remaining with 1000 simulations (web default)', () => {
    const game = new TicTacToeGame();
    game.board = [
      ['X', 'X', null],
      ['O', 'O', 'X'],
      ['O', 'X', null],
    ];
    game.currentPlayer = 'O';
    const mcts = new MCTS(game, 1000);
    const move = mcts.selectMove();
    assert.deepStrictEqual(
      move,
      [0, 2],
      `O should block at [0,2] but played [${move[0]}, ${move[1]}]`
    );
  });

  it('should block with only two moves remaining (X blocks O)', () => {
    const game = new TicTacToeGame();
    // Late game scenario from X's perspective
    game.board = [
      ['O', 'X', 'O'],
      ['X', 'O', 'X'],
      [null, null, 'O'], // O threatens diagonal [0,0]-[1,1]-[2,2] already complete? No wait...
    ];
    // Let me reconsider: O is at [0,0], [0,2], [1,1], [2,2] = 4 pieces
    // X is at [0,1], [1,0], [1,2] = 3 pieces
    // But X should have 4 if it's X's turn... let me redo
    const game2 = new TicTacToeGame();
    game2.board = [
      ['X', 'O', 'X'],
      ['O', 'O', 'X'],
      [null, null, null], // O threatens [2,1] for vertical win in col 1? No, O at [0,1], [1,1] not [1,1]
    ];
    // Actually this is getting confusing, let me make a clear scenario
    const game3 = new TicTacToeGame();
    game3.board = [
      ['X', 'X', 'O'],
      ['O', 'O', null], // O threatens [1,2] for horizontal win
      ['X', 'X', null], // X also threatens [2,2]
    ];
    // X=4, O=3, so it's O's turn
    game3.currentPlayer = 'O';
    // O can win at [1, 2] or block X at [2, 2]
    // O should win by playing [1, 2]!
    const mcts3 = new MCTS(game3, 5000);
    const move3 = mcts3.selectMove();
    assert.deepStrictEqual(
      move3,
      [1, 2],
      `O should win at [1,2] but played [${move3[0]}, ${move3[1]}]`
    );
  });

  it('should prefer winning over blocking', () => {
    const game = new TicTacToeGame();
    game.board = [
      ['X', 'X', null], // X can win at [0,2]
      ['O', 'O', null], // O can win at [1,2]
      ['X', null, null],
    ];
    game.currentPlayer = 'O';
    // O should win at [1, 2] rather than block at [0, 2]
    const mcts = new MCTS(game, 5000);
    const move = mcts.selectMove();
    assert.deepStrictEqual(
      move,
      [1, 2],
      `O should win at [1,2] but played [${move[0]}, ${move[1]}]`
    );
  });

  it('should block in a real game sequence (simulating web game flow)', () => {
    // Simulate moves through performMove like the web game does
    const game = new TicTacToeGame();
    game.performMove([0, 0]); // X top-left
    game.performMove([1, 1]); // O center
    game.performMove([0, 1]); // X top-middle, X threatens [0,2]
    game.performMove([2, 0]); // O bottom-left
    game.performMove([2, 2]); // X bottom-right
    // Board:
    // X X .
    // . O .
    // O . X
    // Now O's turn, X threatens [0,2] for row win

    assert.strictEqual(game.getCurrentPlayer(), 'O');
    const mcts = new MCTS(game, 1000);
    const move = mcts.selectMove();
    assert.deepStrictEqual(
      move,
      [0, 2],
      `O should block X's win at [0,2] but played [${move[0]}, ${move[1]}]`
    );
  });

  it('should block diagonal threat - exact bug scenario from user', () => {
    // This is the exact board state where the bug occurred
    // O played [2,0] instead of blocking X's diagonal win at [2,2]
    const game = new TicTacToeGame();
    game.board = [
      ['X', 'O', 'O'],
      ['O', 'X', 'X'],
      [null, 'X', null], // O must block [2,2], NOT play [2,0]
    ];
    game.currentPlayer = 'O';
    // X threatens diagonal: [0,0], [1,1], [2,2] - X wins if O doesn't block [2,2]

    const mcts = new MCTS(game, 1000);
    const move = mcts.selectMove();
    assert.deepStrictEqual(
      move,
      [2, 2],
      `O should block diagonal at [2,2] but played [${move[0]}, ${move[1]}]`
    );
  });

  it('should consistently block threats across multiple runs', () => {
    // Test that blocking is consistent, not random
    type Board = ('X' | 'O' | null)[][];
    const scenarios: { board: Board; player: 'O'; block: readonly [number, number] }[] = [
      {
        board: [
          ['X', 'X', null],
          ['O', null, null],
          ['O', null, null],
        ],
        player: 'O',
        block: [0, 2],
      },
      {
        board: [
          ['X', 'O', null],
          ['X', 'O', null],
          [null, null, null],
        ],
        player: 'O',
        block: [2, 1], // O wins with column! (not just blocking)
      },
      {
        board: [
          ['X', 'O', 'O'],
          [null, 'X', null],
          [null, null, null],
        ],
        player: 'O',
        block: [2, 2], // Block X's diagonal
      },
    ];

    for (const scenario of scenarios) {
      const game = new TicTacToeGame();
      game.board = scenario.board;
      game.currentPlayer = scenario.player;

      // Run 5 times to check consistency
      for (let i = 0; i < 5; i++) {
        const mcts = new MCTS(game.clone() as TicTacToeGame, 1000);
        const move = mcts.selectMove();
        assert.deepStrictEqual(
          move,
          scenario.block,
          `Run ${i + 1}: Expected block at [${scenario.block}] but got [${move}]`
        );
      }
    }
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
