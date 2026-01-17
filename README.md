MCTS
====

This library implements a simple [Monte Carlo Tree Search](http://en.wikipedia.org/wiki/Monte_Carlo_tree_search) for games.

## Installation

```bash
npm install mcts
```

## Usage

Implement a class that has the following methods:

  * `getPossibleMoves()` returns an array of possible moves (or a `RandomSelection` for random outcomes)
  * `performMove(move)` updates the internal state of the game based on the move
  * `getCurrentPlayer()` returns the current player
  * `getWinner()` returns the winner or `null` if there is no winner
  * `clone()` returns a deep copy of the game state

Then to get the next move a player should perform, call `MCTS` with an instance of your game class.

### TypeScript Example

Here is a simple game where whoever goes first wins:

```typescript
import { MCTS, Game } from 'mcts';

class SimpleGame implements Game<number, number> {
  private winner: number | null = null;

  public getPossibleMoves(): number[] {
    if (this.winner === null) {
      return [0];
    }
    return [];
  }

  public getCurrentPlayer(): number {
    return 0;
  }

  public performMove(move: number): void {
    this.winner = move;
  }

  public getWinner(): number | null {
    return this.winner;
  }

  public clone(): SimpleGame {
    const cloned = new SimpleGame();
    cloned.winner = this.winner;
    return cloned;
  }
}

const mcts = new MCTS(new SimpleGame());
console.log(mcts.selectMove()); // 0
```

### JavaScript Example

```javascript
const { MCTS } = require('mcts');

class SimpleGame {
  constructor() {
    this.winner = null;
  }

  getPossibleMoves() {
    if (this.winner === null) {
      return [0];
    }
    return [];
  }

  getCurrentPlayer() {
    return 0;
  }

  performMove(move) {
    this.winner = move;
  }

  getWinner() {
    return this.winner;
  }

  clone() {
    const cloned = new SimpleGame();
    cloned.winner = this.winner;
    return cloned;
  }
}

const mcts = new MCTS(new SimpleGame());
console.log(mcts.selectMove()); // 0
```

## API

### `MCTS<TMove, TPlayer>`

Constructor:
```typescript
new MCTS(game: Game<TMove, TPlayer>, rounds?: number)
```

- `game`: An instance of your game class implementing the `Game` interface
- `rounds`: Number of simulations to run (default: 1000)

Methods:
- `selectMove(): TMove` - Returns the best move based on MCTS simulations
- `getStats()` - Returns statistics about each possible move (visits, wins)

### `Game<TMove, TPlayer>` Interface

Your game class must implement:

```typescript
interface Game<TMove, TPlayer> {
  getPossibleMoves(): readonly TMove[] | RandomSelection<TMove>;
  performMove(move: TMove): void;
  getCurrentPlayer(): TPlayer;
  getWinner(): TPlayer | null;
  clone(): Game<TMove, TPlayer>;
}
```

### `RandomSelection<T>`

For games with random elements (dice, card draws, etc.), wrap random outcomes in `RandomSelection`:

```typescript
import { RandomSelection } from 'mcts';

getPossibleMoves() {
  if (this.needsDiceRoll) {
    return new RandomSelection([1, 2, 3, 4, 5, 6]);
  }
  return [/* normal moves */];
}
```

## Performance

This implementation uses a clone-once-per-simulation approach for efficiency:
- Game state is cloned once at the start of each simulation
- Moves are applied forward during tree traversal
- No undo operations needed

Average performance: **~470K moves/second** across different game complexities.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Run benchmark
npm run benchmark

# Run all CI checks
npm run ci
```

## License

MIT
