import { MCTS, type TreeNodeInfo } from '../../src/index';
import { Connect4Game, type Connect4Move } from '../../src/games';
import { convertToD3Tree, renderD3Tree } from './tree-viz';

// DOM elements
let boardEl: HTMLElement;
let columnIndicatorsEl: HTMLElement;
let statusEl: HTMLElement;
let simCounterEl: HTMLElement;
let treeContainerEl: HTMLElement;
let newGameBtn: HTMLElement;
let simulationsSelect: HTMLSelectElement;
let showThinkingSelect: HTMLSelectElement;

// Game state
let game: Connect4Game;
let isPlayerTurn = true;
let gameOver = false;

// Initialize DOM references
function initDOM(): void {
  boardEl = document.getElementById('board')!;
  columnIndicatorsEl = document.getElementById('column-indicators')!;
  statusEl = document.getElementById('status')!;
  simCounterEl = document.getElementById('sim-counter')!;
  treeContainerEl = document.getElementById('tree-container')!;
  newGameBtn = document.getElementById('new-game')!;
  simulationsSelect = document.getElementById('simulations') as HTMLSelectElement;
  showThinkingSelect = document.getElementById('show-thinking') as HTMLSelectElement;

  newGameBtn.addEventListener('click', startNewGame);
}

// Create the board cells
function renderBoard(): void {
  // Create column indicators
  columnIndicatorsEl.innerHTML = '';
  for (let col = 0; col < Connect4Game.COLS; col++) {
    const indicator = document.createElement('div');
    indicator.className = 'column-indicator';
    indicator.dataset.col = String(col);
    columnIndicatorsEl.appendChild(indicator);
  }

  // Create board cells (from top to bottom visually, but stored bottom to top)
  boardEl.innerHTML = '';
  for (let row = Connect4Game.ROWS - 1; row >= 0; row--) {
    for (let col = 0; col < Connect4Game.COLS; col++) {
      const cell = document.createElement('div');
      cell.className = 'connect4-cell';
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.addEventListener('click', () => handleCellClick(col));
      boardEl.appendChild(cell);
    }
  }
  updateBoardDisplay();
}

// Update the visual display of the board
function updateBoardDisplay(): void {
  const cells = boardEl.querySelectorAll('.connect4-cell');
  cells.forEach((cell) => {
    const cellEl = cell as HTMLElement;
    const row = parseInt(cellEl.dataset.row!, 10);
    const col = parseInt(cellEl.dataset.col!, 10);
    const value = game.board[row]?.[col];

    // Clear previous classes (keep base class)
    cellEl.classList.remove('Red', 'Yellow', 'occupied', 'disabled', 'winner', 'dropping');

    if (value) {
      cellEl.classList.add(value, 'occupied');
    }

    if (gameOver || !isPlayerTurn) {
      cellEl.classList.add('disabled');
    }
  });

  // Highlight winning cells if game is over
  if (gameOver) {
    const winningCells = game.getWinningCells();
    if (winningCells) {
      for (const { row, col } of winningCells) {
        const cell = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          cell.classList.add('winner');
        }
      }
    }
  }
}

// Handle clicking a column
function handleCellClick(col: number): void {
  if (!isPlayerTurn || gameOver) {
    return;
  }

  const possibleMoves = game.getPossibleMoves();
  if (!possibleMoves.includes(col as Connect4Move)) {
    return;
  }

  // Make the move with drop animation
  const targetRow = findDropRow(col);
  game.performMove(col as Connect4Move);

  // Add dropping animation to the new piece
  if (targetRow !== null) {
    const cell = boardEl.querySelector(`[data-row="${targetRow}"][data-col="${col}"]`);
    if (cell) {
      cell.classList.add('dropping');
      setTimeout(() => cell.classList.remove('dropping'), 400);
    }
  }

  updateBoardDisplay();

  // Check for game over
  const winner = game.getWinner();
  if (winner) {
    gameOver = true;
    setStatus(`<span class="player-${winner.toLowerCase()}">${winner}</span> wins!`);
    updateBoardDisplay();
    return;
  }

  if (game.isBoardFull()) {
    gameOver = true;
    setStatus("It's a draw!");
    return;
  }

  // AI's turn
  isPlayerTurn = false;
  setStatus('AI is thinking...', true);

  // Use setTimeout to allow UI to update before heavy computation
  setTimeout(doAIMove, 50);
}

// Find the row where a piece would drop in a column
function findDropRow(col: number): number | null {
  for (let row = 0; row < Connect4Game.ROWS; row++) {
    if (game.board[row]?.[col] === null) {
      return row;
    }
  }
  return null;
}

// Format move for display in tree
function formatMove(move: Connect4Move | null): string {
  if (move === null) {
    return 'Root';
  }
  return `Col ${move + 1}`;
}

// AI makes a move with visualization
async function doAIMove(): Promise<void> {
  const simulations = parseInt(simulationsSelect.value, 10);
  const showThinking = showThinkingSelect.value === 'true';

  const mcts = new MCTS(game, simulations);

  if (showThinking) {
    // Run simulations in batches for visualization
    const batchSize = Math.min(100, Math.ceil(simulations / 15));
    let completed = 0;

    while (completed < simulations) {
      const remaining = simulations - completed;
      const toRun = Math.min(batchSize, remaining);
      mcts.runSimulations(toRun);
      completed += toRun;

      // Update visualization
      updateSimCounter(completed, simulations);
      highlightColumns(mcts.getMoveStats());
      updateTreeVisualization(mcts.getTreeInfo(3));

      // Yield to allow UI updates
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  } else {
    // Run all simulations at once
    mcts.runSimulations(simulations);
    updateSimCounter(simulations, simulations);
  }

  // Get the best move
  const bestMove = mcts.getBestMove() as Connect4Move | null;
  if (bestMove === null) {
    gameOver = true;
    setStatus("It's a draw!");
    return;
  }

  // Clear highlights and make the move
  clearHighlights();

  // Find target row for animation
  const targetRow = findDropRow(bestMove);
  game.performMove(bestMove);

  // Add dropping animation
  if (targetRow !== null) {
    const cell = boardEl.querySelector(`[data-row="${targetRow}"][data-col="${bestMove}"]`);
    if (cell) {
      cell.classList.add('dropping');
      setTimeout(() => cell.classList.remove('dropping'), 400);
    }
  }

  updateBoardDisplay();

  // Check for game over
  const winner = game.getWinner();
  if (winner) {
    gameOver = true;
    setStatus(`<span class="player-${winner.toLowerCase()}">${winner}</span> wins!`);
    updateBoardDisplay();
    return;
  }

  if (game.isBoardFull()) {
    gameOver = true;
    setStatus("It's a draw!");
    return;
  }

  // Player's turn
  isPlayerTurn = true;
  setStatus('Your turn! Click a column to drop a piece.');
  simCounterEl.textContent = '';
}

// Highlight column indicators based on AI evaluation (by visits)
function highlightColumns(stats: { move: Connect4Move; visits: number; winRate: number }[]): void {
  if (stats.length === 0) {
    return;
  }

  const maxVisits = Math.max(...stats.map((s) => s.visits));

  // Clear existing highlights
  const indicators = columnIndicatorsEl.querySelectorAll('.column-indicator');
  indicators.forEach((ind) => {
    ind.classList.remove('highlight-strong', 'highlight-medium', 'highlight-weak');
  });

  for (const stat of stats) {
    const indicator = columnIndicatorsEl.querySelector(`[data-col="${stat.move}"]`);
    if (!indicator) {
      continue;
    }

    const ratio = stat.visits / maxVisits;
    if (ratio > 0.6) {
      indicator.classList.add('highlight-strong');
    } else if (ratio > 0.2) {
      indicator.classList.add('highlight-medium');
    } else {
      indicator.classList.add('highlight-weak');
    }
  }
}

// Clear all highlights
function clearHighlights(): void {
  const indicators = columnIndicatorsEl.querySelectorAll('.column-indicator');
  indicators.forEach((ind) => {
    ind.classList.remove('highlight-strong', 'highlight-medium', 'highlight-weak');
  });
}

// Update the tree visualization using D3
function updateTreeVisualization(tree: TreeNodeInfo<Connect4Move>): void {
  const d3Tree = convertToD3Tree(tree, formatMove, 3);
  renderD3Tree(treeContainerEl, d3Tree);
}

// Update simulation counter
function updateSimCounter(current: number, total: number): void {
  simCounterEl.textContent = `Simulations: ${current} / ${total}`;
}

// Set status message
function setStatus(message: string, thinking = false): void {
  statusEl.innerHTML = message;
  statusEl.classList.toggle('thinking', thinking);
}

// Start a new game
function startNewGame(): void {
  game = new Connect4Game();
  isPlayerTurn = true;
  gameOver = false;
  setStatus('Your turn! Click a column to drop a piece.');
  simCounterEl.textContent = '';
  treeContainerEl.innerHTML =
    '<p style="color: var(--text-muted);">The AI\'s search tree will appear here when it\'s thinking...</p>';
  renderBoard();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initDOM();
  startNewGame();
});
