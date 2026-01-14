/**
 * Example game implementations for MCTS testing
 */

import { RandomSelection, Game } from './index';

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

  public undoMove(move: number): void {
    this.board[move] = null;
  }

  public getCurrentPlayer(): number {
    return this.currentPlayer;
  }

  public getWinner(): number | null {
    return this.board[0] ?? null;
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

  public undoMove(move: number): void {
    this.board[move] = null;
    this.currentPlayer = (this.currentPlayer + 1) % 2;
  }

  public getCurrentPlayer(): number {
    return this.currentPlayer;
  }

  public getWinner(): number | null {
    return this.board[1] ?? null;
  }
}

type TicTacToePlayer = 'X' | 'O';
type TicTacToeMove = readonly [number, number];

export class TicTacToeGame
  implements Game<TicTacToeMove, TicTacToePlayer>
{
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

  public undoMove(move: TicTacToeMove): void {
    const [y, x] = move;
    const row = this.board[y];
    if (row === undefined) {
      throw new Error(`Invalid row: ${y}`);
    }
    row[x] = null;
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
          2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8,
          8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 11, 11, 12,
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

  public undoMove(move: DiceMove): void {
    this.round--;
    switch (this.round) {
      case 0:
        this.diceToRoll = 0;
        break;
      case 1:
        this.score -= move;
        break;
    }
  }

  public getWinner(): number | null {
    if (this.score > 5) {
      return 1;
    }
    return null;
  }
}
