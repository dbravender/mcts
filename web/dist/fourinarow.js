"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // src/index.ts
  var RandomSelection = class {
    constructor(array) {
      this.array = array;
    }
  };
  var Node = class _Node {
    constructor(parent, move, mcts) {
      this.parent = parent;
      this.move = move;
      this.mcts = mcts;
      __publicField(this, "wins", {});
      __publicField(this, "visits", 0);
      __publicField(this, "children", null);
      __publicField(this, "randomNode", false);
    }
    getUCB1(player) {
      if (this.visits === 0) {
        return Number.POSITIVE_INFINITY;
      }
      if (this.parent === null) {
        return 0;
      }
      const wins = this.wins[String(player)] ?? 0;
      const scorePerVisit = wins / this.visits;
      return scorePerVisit + Math.sqrt(2 * Math.log(this.parent.visits) / this.visits);
    }
    getChildren(game2) {
      if (this.children === null) {
        const movesResult = game2.getPossibleMoves();
        let moves;
        if (movesResult instanceof RandomSelection) {
          moves = movesResult.array;
          this.randomNode = true;
        } else {
          moves = movesResult;
        }
        this.children = moves.map((move) => new _Node(this, move, this.mcts));
      }
      return this.children;
    }
    nextMove(game2) {
      const children = this.getChildren(game2);
      if (children.length === 0) {
        throw new Error("Cannot get next move from a node with no children");
      }
      const shuffled = this.shuffle([...children]);
      if (this.randomNode) {
        const last = shuffled[shuffled.length - 1];
        if (last === void 0) {
          throw new Error("No children available for random selection");
        }
        return last;
      }
      shuffled.sort((a, b) => this.mcts.compareNodes(a, b, game2));
      const best = shuffled[shuffled.length - 1];
      if (best === void 0) {
        throw new Error("No children available after sorting");
      }
      return best;
    }
    shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        const other = array[j];
        if (temp !== void 0 && other !== void 0) {
          array[i] = other;
          array[j] = temp;
        }
      }
      return array;
    }
    // Export tree structure for visualization
    toTreeInfo(player, maxDepth) {
      const playerWins = this.wins[String(player)] ?? 0;
      const winRate = this.visits > 0 ? playerWins / this.visits : 0;
      let childrenInfo = [];
      if (maxDepth > 0 && this.children) {
        childrenInfo = this.children.filter((c) => c.visits > 0).sort((a, b) => b.visits - a.visits).slice(0, 10).map((c) => c.toTreeInfo(player, maxDepth - 1));
      }
      return {
        move: this.move,
        visits: this.visits,
        wins: { ...this.wins },
        winRate,
        children: childrenInfo
      };
    }
  };
  var MCTS = class {
    constructor(game2, rounds) {
      this.game = game2;
      __publicField(this, "rootNode");
      __publicField(this, "rounds");
      this.rounds = rounds ?? 1e3;
      this.rootNode = new Node(null, null, this);
    }
    selectMove() {
      for (let round = 0; round < this.rounds; round++) {
        this.runSimulation();
      }
      const children = this.rootNode.getChildren(this.game);
      if (children.length === 0) {
        throw new Error("No possible moves available");
      }
      let bestChild = children[0];
      if (bestChild === void 0) {
        throw new Error("No children available");
      }
      for (const child of children) {
        if (child.visits > bestChild.visits) {
          bestChild = child;
        }
      }
      if (bestChild.move === null) {
        throw new Error("Best child has null move");
      }
      return bestChild.move;
    }
    getStats() {
      const children = this.rootNode.getChildren(this.game);
      return children.map((child) => {
        if (child.move === null) {
          throw new Error("Child node has null move");
        }
        return {
          move: child.move,
          visits: child.visits,
          wins: { ...child.wins }
        };
      });
    }
    // Run a batch of simulations (for incremental visualization)
    runSimulations(count) {
      for (let i = 0; i < count; i++) {
        this.runSimulation();
      }
    }
    // Get current total simulation count
    getSimulationCount() {
      return this.rootNode.visits;
    }
    // Get tree structure for visualization
    getTreeInfo(maxDepth = 3) {
      const player = this.game.getCurrentPlayer();
      return this.rootNode.toTreeInfo(player, maxDepth);
    }
    // Get the best move without running more simulations
    getBestMove() {
      const children = this.rootNode.children;
      if (!children || children.length === 0) {
        return null;
      }
      let bestChild = children[0];
      if (!bestChild) {
        return null;
      }
      for (const child of children) {
        if (child.visits > bestChild.visits) {
          bestChild = child;
        }
      }
      return bestChild.move;
    }
    // Get move statistics for board highlighting
    getMoveStats() {
      const children = this.rootNode.children;
      if (!children) {
        return [];
      }
      const player = this.game.getCurrentPlayer();
      return children.filter((child) => child.move !== null && child.visits > 0).map((child) => {
        const playerWins = child.wins[String(player)] ?? 0;
        return {
          move: child.move,
          visits: child.visits,
          wins: { ...child.wins },
          winRate: child.visits > 0 ? playerWins / child.visits : 0
        };
      }).sort((a, b) => b.visits - a.visits);
    }
    compareNodes(a, b, game2) {
      if (a.parent === null) {
        return 0;
      }
      const currentPlayer = game2.getCurrentPlayer();
      return a.getUCB1(currentPlayer) - b.getUCB1(currentPlayer);
    }
    runSimulation() {
      const simGame = this.game.clone();
      const path = [this.rootNode];
      let currentNode = this.rootNode;
      currentNode.visits++;
      while (currentNode.getChildren(simGame).length > 0) {
        currentNode = currentNode.nextMove(simGame);
        currentNode.visits++;
        path.push(currentNode);
        if (currentNode.move !== null) {
          simGame.performMove(currentNode.move);
        }
      }
      const winner = simGame.getWinner();
      for (const node of path) {
        if (winner !== null) {
          const winnerKey = String(winner);
          node.wins[winnerKey] = (node.wins[winnerKey] ?? 0) + 1;
        }
      }
    }
  };

  // src/games.ts
  var _Connect4Game = class _Connect4Game {
    constructor() {
      // Board stored as rows from bottom to top, columns left to right
      __publicField(this, "board", []);
      __publicField(this, "currentPlayer", "Red");
      __publicField(this, "lastMove", null);
      this.initBoard();
    }
    initBoard() {
      this.board = [];
      for (let row = 0; row < _Connect4Game.ROWS; row++) {
        this.board.push(new Array(_Connect4Game.COLS).fill(null));
      }
    }
    getPossibleMoves() {
      if (this.getWinner() !== null) {
        return [];
      }
      const moves = [];
      for (let col = 0; col < _Connect4Game.COLS; col++) {
        const topRow = this.board[_Connect4Game.ROWS - 1];
        if (topRow && topRow[col] === null) {
          moves.push(col);
        }
      }
      return moves;
    }
    performMove(move) {
      for (let row = 0; row < _Connect4Game.ROWS; row++) {
        const boardRow = this.board[row];
        if (boardRow && boardRow[move] === null) {
          boardRow[move] = this.currentPlayer;
          this.lastMove = { row, col: move };
          this.currentPlayer = this.currentPlayer === "Red" ? "Yellow" : "Red";
          return;
        }
      }
      throw new Error(`Column ${move} is full`);
    }
    getCurrentPlayer() {
      return this.currentPlayer;
    }
    getLastMove() {
      return this.lastMove;
    }
    getWinner() {
      const directions = [
        [0, 1],
        // horizontal
        [1, 0],
        // vertical
        [1, 1],
        // diagonal down-right
        [1, -1]
        // diagonal down-left
      ];
      for (let row = 0; row < _Connect4Game.ROWS; row++) {
        for (let col = 0; col < _Connect4Game.COLS; col++) {
          const cell = this.board[row]?.[col];
          if (cell === null || cell === void 0) {
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
    checkWinFrom(startRow, startCol, dr, dc, player) {
      for (let i = 0; i < _Connect4Game.WIN_LENGTH; i++) {
        const row = startRow + i * dr;
        const col = startCol + i * dc;
        if (row < 0 || row >= _Connect4Game.ROWS || col < 0 || col >= _Connect4Game.COLS || this.board[row]?.[col] !== player) {
          return false;
        }
      }
      return true;
    }
    // Get the winning line cells (if any)
    getWinningCells() {
      const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]
      ];
      for (let row = 0; row < _Connect4Game.ROWS; row++) {
        for (let col = 0; col < _Connect4Game.COLS; col++) {
          const cell = this.board[row]?.[col];
          if (cell === null || cell === void 0) {
            continue;
          }
          for (const [dr, dc] of directions) {
            if (this.checkWinFrom(row, col, dr, dc, cell)) {
              const cells = [];
              for (let i = 0; i < _Connect4Game.WIN_LENGTH; i++) {
                cells.push({ row: row + i * dr, col: col + i * dc });
              }
              return cells;
            }
          }
        }
      }
      return null;
    }
    isBoardFull() {
      const topRow = this.board[_Connect4Game.ROWS - 1];
      if (!topRow) {
        return false;
      }
      return topRow.every((cell) => cell !== null);
    }
    clone() {
      const cloned = new _Connect4Game();
      cloned.board = this.board.map((row) => [...row]);
      cloned.currentPlayer = this.currentPlayer;
      cloned.lastMove = this.lastMove ? { ...this.lastMove } : null;
      return cloned;
    }
  };
  __publicField(_Connect4Game, "ROWS", 6);
  __publicField(_Connect4Game, "COLS", 7);
  __publicField(_Connect4Game, "WIN_LENGTH", 4);
  var Connect4Game = _Connect4Game;

  // web/src/fourinarow.ts
  var boardEl;
  var columnIndicatorsEl;
  var statusEl;
  var simCounterEl;
  var treeContainerEl;
  var newGameBtn;
  var simulationsSelect;
  var showThinkingSelect;
  var game;
  var isPlayerTurn = true;
  var gameOver = false;
  function initDOM() {
    boardEl = document.getElementById("board");
    columnIndicatorsEl = document.getElementById("column-indicators");
    statusEl = document.getElementById("status");
    simCounterEl = document.getElementById("sim-counter");
    treeContainerEl = document.getElementById("tree-container");
    newGameBtn = document.getElementById("new-game");
    simulationsSelect = document.getElementById("simulations");
    showThinkingSelect = document.getElementById("show-thinking");
    newGameBtn.addEventListener("click", startNewGame);
  }
  function renderBoard() {
    columnIndicatorsEl.innerHTML = "";
    for (let col = 0; col < Connect4Game.COLS; col++) {
      const indicator = document.createElement("div");
      indicator.className = "column-indicator";
      indicator.dataset.col = String(col);
      columnIndicatorsEl.appendChild(indicator);
    }
    boardEl.innerHTML = "";
    for (let row = Connect4Game.ROWS - 1; row >= 0; row--) {
      for (let col = 0; col < Connect4Game.COLS; col++) {
        const cell = document.createElement("div");
        cell.className = "connect4-cell";
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        cell.addEventListener("click", () => handleCellClick(col));
        boardEl.appendChild(cell);
      }
    }
    updateBoardDisplay();
  }
  function updateBoardDisplay() {
    const cells = boardEl.querySelectorAll(".connect4-cell");
    cells.forEach((cell) => {
      const cellEl = cell;
      const row = parseInt(cellEl.dataset.row, 10);
      const col = parseInt(cellEl.dataset.col, 10);
      const value = game.board[row]?.[col];
      cellEl.classList.remove("Red", "Yellow", "occupied", "disabled", "winner", "dropping");
      if (value) {
        cellEl.classList.add(value, "occupied");
      }
      if (gameOver || !isPlayerTurn) {
        cellEl.classList.add("disabled");
      }
    });
    if (gameOver) {
      const winningCells = game.getWinningCells();
      if (winningCells) {
        for (const { row, col } of winningCells) {
          const cell = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
          if (cell)
            cell.classList.add("winner");
        }
      }
    }
  }
  function handleCellClick(col) {
    if (!isPlayerTurn || gameOver)
      return;
    const possibleMoves = game.getPossibleMoves();
    if (!possibleMoves.includes(col))
      return;
    const targetRow = findDropRow(col);
    game.performMove(col);
    if (targetRow !== null) {
      const cell = boardEl.querySelector(`[data-row="${targetRow}"][data-col="${col}"]`);
      if (cell) {
        cell.classList.add("dropping");
        setTimeout(() => cell.classList.remove("dropping"), 400);
      }
    }
    updateBoardDisplay();
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
    isPlayerTurn = false;
    setStatus("AI is thinking...", true);
    setTimeout(doAIMove, 50);
  }
  function findDropRow(col) {
    for (let row = 0; row < Connect4Game.ROWS; row++) {
      if (game.board[row]?.[col] === null) {
        return row;
      }
    }
    return null;
  }
  async function doAIMove() {
    const simulations = parseInt(simulationsSelect.value, 10);
    const showThinking = showThinkingSelect.value === "true";
    const mcts = new MCTS(game, simulations);
    if (showThinking) {
      const batchSize = Math.min(100, Math.ceil(simulations / 15));
      let completed = 0;
      while (completed < simulations) {
        const remaining = simulations - completed;
        const toRun = Math.min(batchSize, remaining);
        mcts.runSimulations(toRun);
        completed += toRun;
        updateSimCounter(completed, simulations);
        highlightColumns(mcts.getMoveStats());
        updateTreeVisualization(mcts.getTreeInfo(3));
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } else {
      mcts.runSimulations(simulations);
      updateSimCounter(simulations, simulations);
    }
    const bestMove = mcts.getBestMove();
    if (bestMove === null) {
      gameOver = true;
      setStatus("It's a draw!");
      return;
    }
    clearHighlights();
    const targetRow = findDropRow(bestMove);
    game.performMove(bestMove);
    if (targetRow !== null) {
      const cell = boardEl.querySelector(`[data-row="${targetRow}"][data-col="${bestMove}"]`);
      if (cell) {
        cell.classList.add("dropping");
        setTimeout(() => cell.classList.remove("dropping"), 400);
      }
    }
    updateBoardDisplay();
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
    isPlayerTurn = true;
    setStatus("Your turn! Click a column to drop a piece.");
    simCounterEl.textContent = "";
  }
  function highlightColumns(stats) {
    if (stats.length === 0)
      return;
    const maxVisits = Math.max(...stats.map((s) => s.visits));
    const indicators = columnIndicatorsEl.querySelectorAll(".column-indicator");
    indicators.forEach((ind) => {
      ind.classList.remove("highlight-strong", "highlight-medium", "highlight-weak");
    });
    for (const stat of stats) {
      const indicator = columnIndicatorsEl.querySelector(`[data-col="${stat.move}"]`);
      if (!indicator)
        continue;
      const ratio = stat.visits / maxVisits;
      if (ratio > 0.6) {
        indicator.classList.add("highlight-strong");
      } else if (ratio > 0.2) {
        indicator.classList.add("highlight-medium");
      } else {
        indicator.classList.add("highlight-weak");
      }
    }
  }
  function clearHighlights() {
    const indicators = columnIndicatorsEl.querySelectorAll(".column-indicator");
    indicators.forEach((ind) => {
      ind.classList.remove("highlight-strong", "highlight-medium", "highlight-weak");
    });
  }
  function updateTreeVisualization(tree) {
    const html = renderTreeNode(tree, 0, true);
    treeContainerEl.innerHTML = html;
  }
  function renderTreeNode(node, depth, isRoot) {
    if (depth > 2)
      return "";
    const moveStr = isRoot ? "Root" : node.move !== null ? `Column: ${node.move + 1}` : "Unknown";
    const winRatePercent = Math.round(node.winRate * 100);
    const isBest = !isRoot && depth === 1 && node.children.length === 0 && node.visits > 0;
    let html = `
    <div class="tree-node ${isBest ? "best" : ""}">
      <span class="move">${moveStr}</span>
      <span class="stats"> | Visits: ${node.visits} | Win Rate: ${winRatePercent}%</span>
      <div class="win-rate-bar">
        <div class="fill" style="width: ${winRatePercent}%"></div>
      </div>
    </div>
  `;
    if (node.children.length > 0 && depth < 2) {
      html += '<div class="tree-level">';
      const sortedChildren = [...node.children].sort((a, b) => b.visits - a.visits).slice(0, 5);
      for (const child of sortedChildren) {
        html += renderTreeNode(child, depth + 1, false);
      }
      html += "</div>";
    }
    return html;
  }
  function updateSimCounter(current, total) {
    simCounterEl.textContent = `Simulations: ${current} / ${total}`;
  }
  function setStatus(message, thinking = false) {
    statusEl.innerHTML = message;
    statusEl.classList.toggle("thinking", thinking);
  }
  function startNewGame() {
    game = new Connect4Game();
    isPlayerTurn = true;
    gameOver = false;
    setStatus("Your turn! Click a column to drop a piece.");
    simCounterEl.textContent = "";
    treeContainerEl.innerHTML = `<p style="color: var(--text-muted);">The AI's search tree will appear here when it's thinking...</p>`;
    renderBoard();
  }
  document.addEventListener("DOMContentLoaded", () => {
    initDOM();
    startNewGame();
  });
})();
//# sourceMappingURL=fourinarow.js.map
