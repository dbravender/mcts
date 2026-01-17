/**
 * Example game implementations for MCTS testing
 */

import { type Game, RandomSelection } from './index';

export class SingleCellGame implements Game<number, number> {
  private board: (number | null)[] = [null];
  private readonly currentPlayer = 0;

  public getPossibleMoves(): number[] {
    if (this.board[0] === null) {
      return [0];
    }
    return [];
  }

  public performMove(move: number): void {
    this.board[move] = 0;
  }

  public getCurrentPlayer(): number {
    return this.currentPlayer;
  }

  public getWinner(): number | null {
    return this.board[0] ?? null;
  }

  public clone(): SingleCellGame {
    const cloned = new SingleCellGame();
    cloned.board = [...this.board];
    return cloned;
  }
}

export class TwoCellGame implements Game<number, number> {
  private board: (number | null)[] = [null, null];
  private currentPlayer = 0;

  public getPossibleMoves(): number[] {
    const available: number[] = [];
    for (let i = 0; i < 2; i++) {
      if (this.board[i] === null) {
        available.push(i);
      }
    }
    return available;
  }

  public performMove(move: number): void {
    this.board[move] = this.currentPlayer;
    this.currentPlayer = (this.currentPlayer + 1) % 2;
  }

  public getCurrentPlayer(): number {
    return this.currentPlayer;
  }

  public getWinner(): number | null {
    return this.board[1] ?? null;
  }

  public clone(): TwoCellGame {
    const cloned = new TwoCellGame();
    cloned.board = [...this.board];
    cloned.currentPlayer = this.currentPlayer;
    return cloned;
  }
}

type TicTacToePlayer = 'X' | 'O';
type TicTacToeMove = readonly [number, number];

export class TicTacToeGame implements Game<TicTacToeMove, TicTacToePlayer> {
  public board: (TicTacToePlayer | null)[][] = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  private readonly boardScore: readonly (readonly number[])[] = [
    [1, 2, 4],
    [8, 16, 32],
    [64, 128, 256],
  ];

  private readonly winningScores = [7, 56, 448, 73, 146, 292, 273, 84];
  private currentPlayer: TicTacToePlayer = 'X';

  public getPossibleMoves(): TicTacToeMove[] {
    if (this.getWinner() !== null) {
      return [];
    }

    const available: TicTacToeMove[] = [];
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        if (this.board[y]?.[x] === null) {
          available.push([y, x]);
        }
      }
    }
    return available;
  }

  public performMove(move: TicTacToeMove): void {
    const [y, x] = move;
    const row = this.board[y];
    if (row === undefined) {
      throw new Error(`Invalid row: ${y}`);
    }
    row[x] = this.currentPlayer;
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
  }

  public getCurrentPlayer(): TicTacToePlayer {
    return this.currentPlayer;
  }

  public getWinner(): TicTacToePlayer | null {
    const playerScores: Record<TicTacToePlayer, number> = { X: 0, O: 0 };

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const cell = this.board[y]?.[x];
        if (cell !== null && cell !== undefined) {
          const score = this.boardScore[y]?.[x];
          if (score !== undefined) {
            playerScores[cell] += score;
          }
        }
      }
    }

    for (const player of ['X', 'O'] as const) {
      for (const winningScore of this.winningScores) {
        if ((winningScore & playerScores[player]) === winningScore) {
          return player;
        }
      }
    }

    return null;
  }

  public clone(): TicTacToeGame {
    const cloned = new TicTacToeGame();
    cloned.board = this.board.map((row) => [...row]);
    cloned.currentPlayer = this.currentPlayer;
    return cloned;
  }
}

type DiceMove = number;

export class SummingDiceGame implements Game<DiceMove, number> {
  private readonly currentPlayer = 1;
  private round = 0;
  private score = 0;
  private diceToRoll = 0;

  public getPossibleMoves(): DiceMove[] | RandomSelection<DiceMove> {
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
        return new RandomSelection([
          2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 9, 9, 9, 9,
          10, 10, 10, 11, 11, 12,
        ]);
    }
    return [];
  }

  public getCurrentPlayer(): number {
    return this.currentPlayer;
  }

  public performMove(move: DiceMove): void {
    switch (this.round) {
      case 0:
        this.diceToRoll = move;
        break;
      case 1:
        this.score += move;
        break;
    }
    this.round++;
  }

  public getWinner(): number | null {
    if (this.score > 5) {
      return 1;
    }
    return null;
  }

  public clone(): SummingDiceGame {
    const cloned = new SummingDiceGame();
    cloned.round = this.round;
    cloned.score = this.score;
    cloned.diceToRoll = this.diceToRoll;
    return cloned;
  }
}

// Connect 4 / 4 in a Row game implementation
export type Connect4Player = 'Red' | 'Yellow';
export type Connect4Move = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export class Connect4Game implements Game<Connect4Move, Connect4Player> {
  public static readonly ROWS = 6;
  public static readonly COLS = 7;
  public static readonly WIN_LENGTH = 4;

  // Board stored as rows from bottom to top, columns left to right
  public board: (Connect4Player | null)[][] = [];
  private currentPlayer: Connect4Player = 'Red';
  private lastMove: { row: number; col: number } | null = null;

  constructor() {
    this.initBoard();
  }

  private initBoard(): void {
    this.board = [];
    for (let row = 0; row < Connect4Game.ROWS; row++) {
      this.board.push(new Array(Connect4Game.COLS).fill(null));
    }
  }

  public getPossibleMoves(): Connect4Move[] {
    if (this.getWinner() !== null) {
      return [];
    }

    const moves: Connect4Move[] = [];
    for (let col = 0; col < Connect4Game.COLS; col++) {
      // Check if the top row of this column is empty
      const topRow = this.board[Connect4Game.ROWS - 1];
      if (topRow && topRow[col] === null) {
        moves.push(col as Connect4Move);
      }
    }
    return moves;
  }

  public performMove(move: Connect4Move): void {
    // Find the lowest empty row in this column
    for (let row = 0; row < Connect4Game.ROWS; row++) {
      const boardRow = this.board[row];
      if (boardRow && boardRow[move] === null) {
        boardRow[move] = this.currentPlayer;
        this.lastMove = { row, col: move };
        this.currentPlayer = this.currentPlayer === 'Red' ? 'Yellow' : 'Red';
        return;
      }
    }
    throw new Error(`Column ${move} is full`);
  }

  public getCurrentPlayer(): Connect4Player {
    return this.currentPlayer;
  }

  public getLastMove(): { row: number; col: number } | null {
    return this.lastMove;
  }

  public getWinner(): Connect4Player | null {
    // Check all directions from each cell
    const directions: [number, number][] = [
      [0, 1], // horizontal
      [1, 0], // vertical
      [1, 1], // diagonal down-right
      [1, -1], // diagonal down-left
    ];

    for (let row = 0; row < Connect4Game.ROWS; row++) {
      for (let col = 0; col < Connect4Game.COLS; col++) {
        const cell = this.board[row]?.[col];
        if (cell === null || cell === undefined) {
          continue;
        }

        for (const [dr, dc] of directions) {
          if (this.checkWinFrom(row, col, dr, dc, cell)) {
            return cell;
          }
        }
      }
    }
    return null;
  }

  private checkWinFrom(
    startRow: number,
    startCol: number,
    dr: number,
    dc: number,
    player: Connect4Player
  ): boolean {
    for (let i = 0; i < Connect4Game.WIN_LENGTH; i++) {
      const row = startRow + i * dr;
      const col = startCol + i * dc;
      if (
        row < 0 ||
        row >= Connect4Game.ROWS ||
        col < 0 ||
        col >= Connect4Game.COLS ||
        this.board[row]?.[col] !== player
      ) {
        return false;
      }
    }
    return true;
  }

  // Get the winning line cells (if any)
  public getWinningCells(): { row: number; col: number }[] | null {
    const directions: [number, number][] = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];

    for (let row = 0; row < Connect4Game.ROWS; row++) {
      for (let col = 0; col < Connect4Game.COLS; col++) {
        const cell = this.board[row]?.[col];
        if (cell === null || cell === undefined) {
          continue;
        }

        for (const [dr, dc] of directions) {
          if (this.checkWinFrom(row, col, dr, dc, cell)) {
            const cells: { row: number; col: number }[] = [];
            for (let i = 0; i < Connect4Game.WIN_LENGTH; i++) {
              cells.push({ row: row + i * dr, col: col + i * dc });
            }
            return cells;
          }
        }
      }
    }
    return null;
  }

  public isBoardFull(): boolean {
    const topRow = this.board[Connect4Game.ROWS - 1];
    if (!topRow) {
      return false;
    }
    return topRow.every((cell) => cell !== null);
  }

  public clone(): Connect4Game {
    const cloned = new Connect4Game();
    cloned.board = this.board.map((row) => [...row]);
    cloned.currentPlayer = this.currentPlayer;
    cloned.lastMove = this.lastMove ? { ...this.lastMove } : null;
    return cloned;
  }
}
