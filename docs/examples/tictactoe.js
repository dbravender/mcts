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
  var TicTacToeGame = class _TicTacToeGame {
    constructor() {
      __publicField(this, "board", [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ]);
      __publicField(this, "boardScore", [
        [1, 2, 4],
        [8, 16, 32],
        [64, 128, 256]
      ]);
      __publicField(this, "winningScores", [7, 56, 448, 73, 146, 292, 273, 84]);
      __publicField(this, "currentPlayer", "X");
    }
    getPossibleMoves() {
      if (this.getWinner() !== null) {
        return [];
      }
      const available = [];
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          if (this.board[y]?.[x] === null) {
            available.push([y, x]);
          }
        }
      }
      return available;
    }
    performMove(move) {
      const [y, x] = move;
      const row = this.board[y];
      if (row === void 0) {
        throw new Error(`Invalid row: ${y}`);
      }
      row[x] = this.currentPlayer;
      this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    }
    getCurrentPlayer() {
      return this.currentPlayer;
    }
    getWinner() {
      const playerScores = { X: 0, O: 0 };
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const cell = this.board[y]?.[x];
          if (cell !== null && cell !== void 0) {
            const score = this.boardScore[y]?.[x];
            if (score !== void 0) {
              playerScores[cell] += score;
            }
          }
        }
      }
      for (const player of ["X", "O"]) {
        for (const winningScore of this.winningScores) {
          if ((winningScore & playerScores[player]) === winningScore) {
            return player;
          }
        }
      }
      return null;
    }
    clone() {
      const cloned = new _TicTacToeGame();
      cloned.board = this.board.map((row) => [...row]);
      cloned.currentPlayer = this.currentPlayer;
      return cloned;
    }
  };

  // web/src/tictactoe.ts
  var boardEl;
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
    statusEl = document.getElementById("status");
    simCounterEl = document.getElementById("sim-counter");
    treeContainerEl = document.getElementById("tree-container");
    newGameBtn = document.getElementById("new-game");
    simulationsSelect = document.getElementById("simulations");
    showThinkingSelect = document.getElementById("show-thinking");
    newGameBtn.addEventListener("click", startNewGame);
  }
  function renderBoard() {
    boardEl.innerHTML = "";
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cell = document.createElement("div");
        cell.className = "tictactoe-cell";
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        cell.addEventListener("click", () => handleCellClick(row, col));
        boardEl.appendChild(cell);
      }
    }
    updateBoardDisplay();
  }
  function updateBoardDisplay() {
    const cells = boardEl.querySelectorAll(".tictactoe-cell");
    cells.forEach((cell) => {
      const cellEl = cell;
      const row = parseInt(cellEl.dataset.row, 10);
      const col = parseInt(cellEl.dataset.col, 10);
      const value = game.board[row]?.[col];
      cellEl.classList.remove(
        "X",
        "O",
        "occupied",
        "disabled",
        "highlight-strong",
        "highlight-medium",
        "highlight-weak",
        "winner"
      );
      cellEl.textContent = "";
      const indicator = cellEl.querySelector(".visit-indicator");
      if (indicator) {
        indicator.remove();
      }
      if (value) {
        cellEl.textContent = value;
        cellEl.classList.add(value, "occupied");
      }
      if (gameOver || !isPlayerTurn) {
        cellEl.classList.add("disabled");
      }
    });
    if (gameOver && game.getWinner()) {
      highlightWinningCells();
    }
  }
  function highlightWinningCells() {
    const winningLines = [
      [[0, 0], [0, 1], [0, 2]],
      // rows
      [[1, 0], [1, 1], [1, 2]],
      [[2, 0], [2, 1], [2, 2]],
      [[0, 0], [1, 0], [2, 0]],
      // cols
      [[0, 1], [1, 1], [2, 1]],
      [[0, 2], [1, 2], [2, 2]],
      [[0, 0], [1, 1], [2, 2]],
      // diagonals
      [[0, 2], [1, 1], [2, 0]]
    ];
    for (const line of winningLines) {
      const [a, b, c] = line;
      const valA = game.board[a[0]]?.[a[1]];
      const valB = game.board[b[0]]?.[b[1]];
      const valC = game.board[c[0]]?.[c[1]];
      if (valA && valA === valB && valB === valC) {
        for (const [row, col] of line) {
          const cell = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
          if (cell) {
            cell.classList.add("winner");
          }
        }
        break;
      }
    }
  }
  function handleCellClick(row, col) {
    if (!isPlayerTurn || gameOver) {
      return;
    }
    const boardRow = game.board[row];
    if (!boardRow || boardRow[col] !== null) {
      return;
    }
    game.performMove([row, col]);
    updateBoardDisplay();
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
    isPlayerTurn = false;
    setStatus("AI is thinking...", true);
    setTimeout(doAIMove, 50);
  }
  async function doAIMove() {
    const simulations = parseInt(simulationsSelect.value, 10);
    const showThinking = showThinkingSelect.value === "true";
    const mcts = new MCTS(game, simulations);
    if (showThinking) {
      const batchSize = Math.min(50, Math.ceil(simulations / 20));
      let completed = 0;
      while (completed < simulations) {
        const remaining = simulations - completed;
        const toRun = Math.min(batchSize, remaining);
        mcts.runSimulations(toRun);
        completed += toRun;
        updateSimCounter(completed, simulations);
        highlightMoves(mcts.getMoveStats());
        updateTreeVisualization(mcts.getTreeInfo(3));
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } else {
      mcts.runSimulations(simulations);
      updateSimCounter(simulations, simulations);
    }
    const bestMove = mcts.getBestMove();
    if (!bestMove) {
      gameOver = true;
      setStatus("It's a draw!");
      return;
    }
    clearHighlights();
    game.performMove(bestMove);
    updateBoardDisplay();
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
    isPlayerTurn = true;
    setStatus("Your turn! Click a cell to play.");
    simCounterEl.textContent = "";
  }
  function highlightMoves(stats) {
    if (stats.length === 0) {
      return;
    }
    const maxVisits = Math.max(...stats.map((s) => s.visits));
    const cells = boardEl.querySelectorAll(".tictactoe-cell");
    cells.forEach((cell) => {
      const cellEl = cell;
      cellEl.classList.remove("highlight-strong", "highlight-medium", "highlight-weak");
      const existing = cellEl.querySelector(".visit-indicator");
      if (existing) {
        existing.remove();
      }
    });
    for (const stat of stats) {
      const [row, col] = stat.move;
      const cell = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (!cell || cell.classList.contains("occupied")) {
        continue;
      }
      const ratio = stat.visits / maxVisits;
      if (ratio > 0.6) {
        cell.classList.add("highlight-strong");
      } else if (ratio > 0.2) {
        cell.classList.add("highlight-medium");
      } else {
        cell.classList.add("highlight-weak");
      }
      const indicator = document.createElement("span");
      indicator.className = "visit-indicator";
      indicator.textContent = String(stat.visits);
      cell.appendChild(indicator);
    }
  }
  function clearHighlights() {
    const cells = boardEl.querySelectorAll(".tictactoe-cell");
    cells.forEach((cell) => {
      cell.classList.remove("highlight-strong", "highlight-medium", "highlight-weak");
      const indicator = cell.querySelector(".visit-indicator");
      if (indicator) {
        indicator.remove();
      }
    });
  }
  function updateTreeVisualization(tree) {
    const html = renderTreeNode(tree, 0, true, tree);
    treeContainerEl.innerHTML = html;
  }
  function renderTreeNode(node, depth, isRoot, rootTree) {
    if (depth > 2) {
      return "";
    }
    const moveStr = isRoot ? "Root" : node.move ? `[${node.move[0]}, ${node.move[1]}]` : "Unknown";
    const visitClass = depth === 1 ? getVisitClass(node.visits, rootTree.children) : "";
    let html = `
    <div class="tree-node ${visitClass}">
      <span class="move">${moveStr}</span>
      <span class="stats"> | Visits: ${node.visits}</span>
      <div class="visit-bar">
        <div class="fill" style="width: ${Math.min(100, node.visits / Math.max(1, rootTree.visits) * 100)}%"></div>
      </div>
    </div>
  `;
    if (node.children.length > 0 && depth < 2) {
      html += '<div class="tree-level">';
      const sortedChildren = [...node.children].sort((a, b) => b.visits - a.visits).slice(0, 5);
      for (const child of sortedChildren) {
        html += renderTreeNode(child, depth + 1, false, rootTree);
      }
      html += "</div>";
    }
    return html;
  }
  function getVisitClass(visits, siblings) {
    if (siblings.length === 0) {
      return "";
    }
    const maxVisits = Math.max(...siblings.map((s) => s.visits));
    const ratio = visits / maxVisits;
    if (ratio > 0.6) {
      return "best";
    }
    return "";
  }
  function updateSimCounter(current, total) {
    simCounterEl.textContent = `Simulations: ${current} / ${total}`;
  }
  function setStatus(message, thinking = false) {
    statusEl.innerHTML = message;
    statusEl.classList.toggle("thinking", thinking);
  }
  function startNewGame() {
    game = new TicTacToeGame();
    isPlayerTurn = true;
    gameOver = false;
    setStatus("Your turn! Click a cell to play.");
    simCounterEl.textContent = "";
    treeContainerEl.innerHTML = `<p style="color: var(--text-muted);">The AI's search tree will appear here when it's thinking...</p>`;
    renderBoard();
  }
  document.addEventListener("DOMContentLoaded", () => {
    initDOM();
    startNewGame();
  });
})();
//# sourceMappingURL=tictactoe.js.map
