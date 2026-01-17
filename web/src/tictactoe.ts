import { MCTS, type TreeNodeInfo } from '../../src/index';
import { TicTacToeGame } from '../../src/games';

type TicTacToeMove = readonly [number, number];

// DOM elements
let boardEl: HTMLElement;
let statusEl: HTMLElement;
let simCounterEl: HTMLElement;
let treeContainerEl: HTMLElement;
let newGameBtn: HTMLElement;
let simulationsSelect: HTMLSelectElement;
let showThinkingSelect: HTMLSelectElement;

// Game state
let game: TicTacToeGame;
let isPlayerTurn = true;
let gameOver = false;

// Initialize DOM references
function initDOM(): void {
  boardEl = document.getElementById('board')!;
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
  boardEl.innerHTML = '';
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cell = document.createElement('div');
      cell.className = 'tictactoe-cell';
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.addEventListener('click', () => handleCellClick(row, col));
      boardEl.appendChild(cell);
    }
  }
  updateBoardDisplay();
}

// Update the visual display of the board
function updateBoardDisplay(): void {
  const cells = boardEl.querySelectorAll('.tictactoe-cell');
  cells.forEach((cell) => {
    const cellEl = cell as HTMLElement;
    const row = parseInt(cellEl.dataset.row!, 10);
    const col = parseInt(cellEl.dataset.col!, 10);
    const value = game.board[row]?.[col];

    // Clear previous classes
    cellEl.classList.remove(
      'X',
      'O',
      'occupied',
      'disabled',
      'highlight-strong',
      'highlight-medium',
      'highlight-weak',
      'winner'
    );
    cellEl.textContent = '';

    // Remove any visit indicator
    const indicator = cellEl.querySelector('.visit-indicator');
    if (indicator) {
      indicator.remove();
    }

    if (value) {
      cellEl.textContent = value;
      cellEl.classList.add(value, 'occupied');
    }

    if (gameOver || !isPlayerTurn) {
      cellEl.classList.add('disabled');
    }
  });

  // Highlight winning cells if game is over
  if (gameOver && game.getWinner()) {
    highlightWinningCells();
  }
}

// Find and highlight winning cells
function highlightWinningCells(): void {
  const winningLines = [
    [[0, 0], [0, 1], [0, 2]], // rows
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]], // cols
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]], // diagonals
    [[0, 2], [1, 1], [2, 0]],
  ];

  for (const line of winningLines) {
    const [a, b, c] = line as [[number, number], [number, number], [number, number]];
    const valA = game.board[a[0]]?.[a[1]];
    const valB = game.board[b[0]]?.[b[1]];
    const valC = game.board[c[0]]?.[c[1]];

    if (valA && valA === valB && valB === valC) {
      for (const [row, col] of line as [number, number][]) {
        const cell = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          cell.classList.add('winner');
        }
      }
      break;
    }
  }
}

// Handle player clicking a cell
function handleCellClick(row: number, col: number): void {
  if (!isPlayerTurn || gameOver) {
    return;
  }

  const boardRow = game.board[row];
  if (!boardRow || boardRow[col] !== null) {
    return;
  }

  // Make the move
  game.performMove([row, col] as TicTacToeMove);
  updateBoardDisplay();

  // Check for game over
  const winner = game.getWinner();
  if (winner) {
    gameOver = true;
    setStatus(`<span class="player-${winner.toLowerCase()}">${winner}</span> wins!`);
    updateBoardDisplay();
    return;
  }

  if (game.getPossibleMoves().length === 0) {
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

// AI makes a move with visualization
async function doAIMove(): Promise<void> {
  const simulations = parseInt(simulationsSelect.value, 10);
  const showThinking = showThinkingSelect.value === 'true';

  const mcts = new MCTS(game, simulations);

  if (showThinking) {
    // Run simulations in batches for visualization
    const batchSize = Math.min(50, Math.ceil(simulations / 20));
    let completed = 0;

    while (completed < simulations) {
      const remaining = simulations - completed;
      const toRun = Math.min(batchSize, remaining);
      mcts.runSimulations(toRun);
      completed += toRun;

      // Update visualization
      updateSimCounter(completed, simulations);
      highlightMoves(mcts.getMoveStats());
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
  const bestMove = mcts.getBestMove() as TicTacToeMove | null;
  if (!bestMove) {
    gameOver = true;
    setStatus("It's a draw!");
    return;
  }

  // Clear highlights and make the move
  clearHighlights();
  game.performMove(bestMove);
  updateBoardDisplay();

  // Check for game over
  const winner = game.getWinner();
  if (winner) {
    gameOver = true;
    setStatus(`<span class="player-${winner.toLowerCase()}">${winner}</span> wins!`);
    updateBoardDisplay();
    return;
  }

  if (game.getPossibleMoves().length === 0) {
    gameOver = true;
    setStatus("It's a draw!");
    return;
  }

  // Player's turn
  isPlayerTurn = true;
  setStatus('Your turn! Click a cell to play.');
  simCounterEl.textContent = '';
}

// Highlight cells based on AI evaluation (by visits)
function highlightMoves(stats: { move: TicTacToeMove; visits: number; winRate: number }[]): void {
  if (stats.length === 0) {
    return;
  }

  const maxVisits = Math.max(...stats.map((s) => s.visits));
  const cells = boardEl.querySelectorAll('.tictactoe-cell');

  cells.forEach((cell) => {
    const cellEl = cell as HTMLElement;
    cellEl.classList.remove('highlight-strong', 'highlight-medium', 'highlight-weak');

    // Remove existing indicator
    const existing = cellEl.querySelector('.visit-indicator');
    if (existing) {
      existing.remove();
    }
  });

  for (const stat of stats) {
    const [row, col] = stat.move;
    const cell = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`) as HTMLElement;
    if (!cell || cell.classList.contains('occupied')) {
      continue;
    }

    const ratio = stat.visits / maxVisits;
    if (ratio > 0.6) {
      cell.classList.add('highlight-strong');
    } else if (ratio > 0.2) {
      cell.classList.add('highlight-medium');
    } else {
      cell.classList.add('highlight-weak');
    }

    // Add visit count indicator
    const indicator = document.createElement('span');
    indicator.className = 'visit-indicator';
    indicator.textContent = String(stat.visits);
    cell.appendChild(indicator);
  }
}

// Clear all highlights
function clearHighlights(): void {
  const cells = boardEl.querySelectorAll('.tictactoe-cell');
  cells.forEach((cell) => {
    cell.classList.remove('highlight-strong', 'highlight-medium', 'highlight-weak');
    const indicator = cell.querySelector('.visit-indicator');
    if (indicator) {
      indicator.remove();
    }
  });
}

// Update the tree visualization (text-based)
function updateTreeVisualization(tree: TreeNodeInfo<TicTacToeMove>): void {
  const html = renderTreeNode(tree, 0, true);
  treeContainerEl.innerHTML = html;
}

// Render a tree node recursively
function renderTreeNode(node: TreeNodeInfo<TicTacToeMove>, depth: number, isRoot: boolean): string {
  if (depth > 2) {
    return '';
  }

  const moveStr = isRoot
    ? 'Root'
    : node.move
      ? `[${node.move[0]}, ${node.move[1]}]`
      : 'Unknown';

  // Color based on visits relative to siblings
  const visitClass = depth === 1 ? getVisitClass(node.visits, tree.children) : '';

  let html = `
    <div class="tree-node ${visitClass}">
      <span class="move">${moveStr}</span>
      <span class="stats"> | Visits: ${node.visits}</span>
      <div class="visit-bar">
        <div class="fill" style="width: ${Math.min(100, (node.visits / Math.max(1, tree.visits)) * 100)}%"></div>
      </div>
    </div>
  `;

  if (node.children.length > 0 && depth < 2) {
    html += '<div class="tree-level">';
    // Sort children by visits and show top ones
    const sortedChildren = [...node.children].sort((a, b) => b.visits - a.visits).slice(0, 5);
    for (const child of sortedChildren) {
      html += renderTreeNode(child, depth + 1, false);
    }
    html += '</div>';
  }

  return html;
}

// Store tree reference for relative visit calculation
let tree: TreeNodeInfo<TicTacToeMove>;

// Get visit class based on relative visits
function getVisitClass(visits: number, siblings: TreeNodeInfo<TicTacToeMove>[]): string {
  if (siblings.length === 0) {
    return '';
  }
  const maxVisits = Math.max(...siblings.map((s) => s.visits));
  const ratio = visits / maxVisits;
  if (ratio > 0.6) {
    return 'best';
  }
  return '';
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
  game = new TicTacToeGame();
  isPlayerTurn = true;
  gameOver = false;
  setStatus('Your turn! Click a cell to play.');
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
