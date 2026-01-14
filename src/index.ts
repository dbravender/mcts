/**
 * Modern TypeScript implementation of Monte Carlo Tree Search (MCTS)
 * with efficient mutable game state instead of cloning.
 */

export class RandomSelection<T> {
  constructor(public readonly array: readonly T[]) {}
}

export interface Game<TMove = unknown, TPlayer = unknown> {
  getPossibleMoves(): readonly TMove[] | RandomSelection<TMove>;
  performMove(move: TMove): void;
  undoMove(move: TMove): void;
  getCurrentPlayer(): TPlayer;
  getWinner(): TPlayer | null;
}

type PlayerScore = Record<string, number>;

class Node<TMove, TPlayer> {
  public wins: PlayerScore = {};
  public visits = 0;
  public children: Node<TMove, TPlayer>[] | null = null;
  public randomNode = false;
  private moveApplied = false;

  constructor(
    public readonly game: Game<TMove, TPlayer>,
    public readonly parent: Node<TMove, TPlayer> | null,
    public readonly move: TMove | null,
    public readonly depth: number,
    private readonly mcts: MCTS<TMove, TPlayer>
  ) {}

  public getUCB1(player: TPlayer): number {
    // Always visit unvisited nodes first
    if (this.visits === 0) return Infinity;
    if (this.parent === null) return 0;

    const wins = this.wins[String(player)] ?? 0;
    const scorePerVisit = wins / this.visits;

    // UCB1 formula: exploitation + exploration
    // See https://en.wikipedia.org/wiki/Monte_Carlo_tree_search#Exploration_and_exploitation
    return (
      scorePerVisit +
      Math.sqrt((2 * Math.log(this.parent.visits)) / this.visits)
    );
  }

  public getChildren(): Node<TMove, TPlayer>[] {
    // Always apply the move when getting children, even if cached
    this.applyMove();

    if (this.children === null) {
      const movesResult = this.game.getPossibleMoves();
      let moves: readonly TMove[];

      if (movesResult instanceof RandomSelection) {
        moves = movesResult.array;
        this.randomNode = true;
      } else {
        moves = movesResult;
      }

      this.children = moves.map(
        (move) =>
          new Node<TMove, TPlayer>(
            this.game,
            this,
            move,
            this.depth + 1,
            this.mcts
          )
      );
    }
    return this.children;
  }

  public getWinner(): TPlayer | null {
    // Forces the move to be performed
    this.getChildren();
    return this.game.getWinner();
  }

  public nextMove(): Node<TMove, TPlayer> {
    const children = this.getChildren();

    if (children.length === 0) {
      throw new Error("Cannot get next move from a node with no children");
    }

    // Shuffle to randomize equal nodes
    const shuffled = this.shuffle([...children]);

    if (this.randomNode) {
      const last = shuffled[shuffled.length - 1];
      if (last === undefined) {
        throw new Error("No children available for random selection");
      }
      return last;
    }

    // Sort by UCB1 score and pick the best
    shuffled.sort((a, b) => this.mcts.compareNodes(a, b));
    const best = shuffled[shuffled.length - 1];
    if (best === undefined) {
      throw new Error("No children available after sorting");
    }
    return best;
  }

  public applyMove(): void {
    if (!this.moveApplied && this.move !== null) {
      this.game.performMove(this.move);
      this.moveApplied = true;
    }
  }

  public undoMove(): void {
    if (this.moveApplied && this.move !== null) {
      this.game.undoMove(this.move);
      this.moveApplied = false;
    }
  }

  private shuffle<T>(array: T[]): T[] {
    // Fisher-Yates shuffle
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      const other = array[j];
      if (temp !== undefined && other !== undefined) {
        array[i] = other;
        array[j] = temp;
      }
    }
    return array;
  }
}

export class MCTS<TMove = unknown, TPlayer = unknown> {
  private readonly rootNode: Node<TMove, TPlayer>;
  private readonly rounds: number;

  constructor(
    game: Game<TMove, TPlayer>,
    rounds?: number
  ) {
    this.rounds = rounds ?? 1000;
    this.rootNode = new Node<TMove, TPlayer>(game, null, null, 0, this);
  }

  public selectMove(): TMove {
    for (let round = 0; round < this.rounds; round++) {
      this.runSimulation();
    }

    const children = this.rootNode.getChildren();
    if (children.length === 0) {
      throw new Error("No possible moves available");
    }

    // Select the child with the most visits
    let bestChild = children[0];
    if (bestChild === undefined) {
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

  public getStats(): { move: TMove; visits: number; wins: PlayerScore }[] {
    const children = this.rootNode.getChildren();
    return children.map((child) => {
      if (child.move === null) {
        throw new Error("Child node has null move");
      }
      return {
        move: child.move,
        visits: child.visits,
        wins: { ...child.wins },
      };
    });
  }

  public compareNodes(a: Node<TMove, TPlayer>, b: Node<TMove, TPlayer>): number {
    if (a.parent === null) return 0;
    const currentPlayer = a.parent.game.getCurrentPlayer();
    return a.getUCB1(currentPlayer) - b.getUCB1(currentPlayer);
  }

  private runSimulation(): void {
    const path: Node<TMove, TPlayer>[] = [this.rootNode];
    let currentNode = this.rootNode;
    currentNode.visits++;

    // Selection: traverse down the tree using UCB1
    while (currentNode.getChildren().length > 0) {
      currentNode = currentNode.nextMove();
      currentNode.visits++;
      path.push(currentNode);
    }

    // Get the winner at this leaf node
    const winner = currentNode.getWinner();

    // Backpropagation: update wins up the tree
    for (const node of path) {
      if (winner !== null) {
        const winnerKey = String(winner);
        node.wins[winnerKey] = (node.wins[winnerKey] ?? 0) + 1;
      }
    }

    // Undo all moves to restore game state
    for (let i = path.length - 1; i >= 0; i--) {
      const node = path[i];
      if (node !== undefined) {
        node.undoMove();
      }
    }
  }
}
