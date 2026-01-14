/**
 * Benchmark suite for MCTS performance measurement
 */

import { MCTS } from './index';
import {
  SingleCellGame,
  TwoCellGame,
  TicTacToeGame,
  SummingDiceGame,
} from './games';

interface BenchmarkResult {
  gameName: string;
  rounds: number;
  totalTimeMs: number;
  movesPerSecond: number;
  simulationsPerSecond: number;
}

function benchmark<TMove, TPlayer>(
  gameName: string,
  gameFactory: () => MCTS<TMove, TPlayer>,
  rounds: number,
  iterations = 10
): BenchmarkResult {
  const times: number[] = [];

  // Warm-up run
  const warmupMcts = gameFactory();
  warmupMcts.selectMove();

  // Actual benchmark runs
  for (let i = 0; i < iterations; i++) {
    const mcts = gameFactory();

    const start = performance.now();
    mcts.selectMove();
    const end = performance.now();

    times.push(end - start);
  }

  // Calculate statistics
  const totalTimeMs = times.reduce((sum, time) => sum + time, 0) / iterations;
  const movesPerSecond = (1000 / totalTimeMs) * rounds;
  const simulationsPerSecond = 1000 / totalTimeMs;

  return {
    gameName,
    rounds,
    totalTimeMs,
    movesPerSecond,
    simulationsPerSecond,
  };
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

function formatDecimal(num: number, decimals = 2): string {
  return num.toLocaleString('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

function printResults(results: BenchmarkResult[]): void {
  console.log('\n=== MCTS Performance Benchmark ===\n');
  console.log('Using mutable game state (no cloning)\n');

  for (const result of results) {
    console.log(`Game: ${result.gameName}`);
    console.log(`  Rounds per decision: ${formatNumber(result.rounds)}`);
    console.log(`  Average time: ${formatDecimal(result.totalTimeMs)} ms`);
    console.log(
      `  Simulations/second: ${formatNumber(result.simulationsPerSecond)}`
    );
    console.log(
      `  Moves evaluated/second: ${formatNumber(result.movesPerSecond)}`
    );
    console.log();
  }

  // Summary
  const totalMoves = results.reduce(
    (sum, result) => sum + result.movesPerSecond,
    0
  );
  const avgMovesPerSecond = totalMoves / results.length;

  console.log('=== Summary ===');
  console.log(
    `Average moves/second across all games: ${formatNumber(avgMovesPerSecond)}`
  );
  console.log();
}

function main(): void {
  console.log('Starting MCTS benchmark...\n');

  const results: BenchmarkResult[] = [];

  // Benchmark different games with different complexities
  results.push(benchmark('SingleCellGame', () => new MCTS(new SingleCellGame(), 1000), 1000));
  results.push(benchmark('TwoCellGame', () => new MCTS(new TwoCellGame(), 1000), 1000));
  results.push(benchmark('TicTacToe', () => new MCTS(new TicTacToeGame(), 1000), 1000));
  results.push(benchmark('TicTacToe (complex)', () => {
    const game = new TicTacToeGame();
    game.board = [
      ['O', 'O', null],
      ['X', 'X', null],
      ['O', 'O', null],
    ];
    return new MCTS(game, 1000);
  }, 1000));
  results.push(benchmark('SummingDice', () => new MCTS(new SummingDiceGame(), 1000), 1000));

  // High-intensity benchmarks
  results.push(
    benchmark('TicTacToe (10k rounds)', () => new MCTS(new TicTacToeGame(), 10000), 10000)
  );

  printResults(results);
}

// Run benchmark if this is the main module
if (require.main === module) {
  main();
}

export { benchmark, BenchmarkResult };
