/*
    Curran Seam
    TCSS 435 AI
    2048
*/

// helper functions
function randomInt(n) {
    return Math.floor(Math.random() * n);
};

function AgentBrain(gameEngine) {
    this.size = 4;
    this.previousState = gameEngine.grid.serialize();
    this.reset();
    this.score = 0;
};

AgentBrain.prototype.reset = function() {
    this.score = 0;
    this.grid = new Grid(this.previousState.size, this.previousState.cells);
};

// Adds a tile in a random position
AgentBrain.prototype.addRandomTile = function() {
    if (this.grid.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 2 : 4;
        var tile = new Tile(this.grid.randomAvailableCell(), value);

        this.grid.insertTile(tile);
    }
};

AgentBrain.prototype.moveTile = function(tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
AgentBrain.prototype.move = function(direction) {
    // 0: up, 1: right, 2: down, 3: left
    var self = this;

    var cell, tile;

    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;

    //console.log(vector);

    //console.log(traversals);

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function(x) {
        traversals.y.forEach(function(y) {
            cell = { x: x, y: y };
            tile = self.grid.cellContent(cell);

            if (tile) {
                var positions = self.findFarthestPosition(cell, vector);
                var next = self.grid.cellContent(positions.next);

                // Only one merger per row traversal?
                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    self.grid.insertTile(merged);
                    self.grid.removeTile(tile);

                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);

                    // Update the score
                    self.score += merged.value;

                } else {
                    self.moveTile(tile, positions.farthest);
                }

                if (!self.positionsEqual(cell, tile)) {
                    moved = true; // The tile moved from its original cell!
                }
            }
        });
    });
    //console.log(moved);
    if (moved) {
        this.addRandomTile();
    }
    return moved;
};

// Get the vector representing the chosen direction
AgentBrain.prototype.getVector = function(direction) {
    // Vectors representing tile movement
    var map = {
        0: { x: 0, y: -1 }, // Up
        1: { x: 1, y: 0 }, // Right
        2: { x: 0, y: 1 }, // Down
        3: { x: -1, y: 0 } // Left
    };

    return map[direction];
};

// Build a list of positions to traverse in the right order
AgentBrain.prototype.buildTraversals = function(vector) {
    var traversals = { x: [], y: [] };

    for (var pos = 0; pos < this.size; pos++) {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
};

AgentBrain.prototype.findFarthestPosition = function(cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell;
        cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) &&
        this.grid.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    };
};

AgentBrain.prototype.positionsEqual = function(first, second) {
    return first.x === second.x && first.y === second.y;
};

function Agent() {};

Agent.prototype.selectMove = function(gameManager) {
    var depth = 5;
    var move = 0;
    var moves = [];
    var brain = new AgentBrain(gameManager)
    for (var i = 0; i < 4; i++) {
        const moved = brain.move(i);
        if (moved) {
            moves.push(this.expectimax(depth - 1, brain, false));
            brain.reset();
        } else moves.push(Number.NEGATIVE_INFINITY);
    }
    var maxScore = moves[0];
    for (var i = 1; i < moves.length; i++) {
        if (maxScore < moves[i]) {
            maxScore = moves[i];
            move = i;
        }
    }
    return move;
};

Agent.prototype.expectimax = function(depth, brain, isMaximizer) {
    if (!brain.grid.cellsAvailable() || depth === 0)
        return this.evaluateGrid(brain.grid); // base case

    const oldGrid = brain.grid.serialize();
    const oldScore = brain.score;
    if (isMaximizer) { // maximizer
        var maxValue = Number.NEGATIVE_INFINITY;
        for (var i = 0; i < 4; i++) {
            if (brain.move(i)) {
                maxValue = Math.max(maxValue, this.expectimax(depth - 1, brain, !isMaximizer));
                brain.score = oldScore;
                brain.grid = new Grid(oldGrid.size, oldGrid.cells);
            }
        }
        return maxValue;
    } else { // chance 
        var freeCells = brain.grid.availableCells();
        var freeCellAmount = freeCells.length;
        var expectedValue = 0;
        for (var i = 0; i < freeCellAmount; i++) {
            brain.grid.insertTile(new Tile(freeCells[i], 2));
            expectedValue += this.expectimax(depth - 1, brain, !isMaximizer) * (1.0 / freeCellAmount) * 0.9;
            brain.score = oldScore;
            brain.grid = new Grid(oldGrid.size, oldGrid.cells);
        }
        for (var i = 0; i < freeCellAmount; i++) {
            brain.grid.insertTile(new Tile(freeCells[i], 4));
            expectedValue += this.expectimax(depth - 1, brain, !isMaximizer) * (1.0 / freeCellAmount) * 0.1;
            brain.score = oldScore;
            brain.grid = new Grid(oldGrid.size, oldGrid.cells);
        }
        return expectedValue;
    }
}

Agent.prototype.evaluateGrid = function(gameBoard) {
    var amounts = [];
    var topLeftWeight = [
        [32768, 256, 128, 1],
        [16384, 512, 64, 2],
        [8192, 1024, 32, 4],
        [4096, 2048, 16, 8]
    ];
    var topRightWeight = [
        [4096, 8192, 16384, 32768],
        [2048, 1024, 512, 256],
        [16, 32, 64, 128],
        [8, 4, 2, 1]
    ];
    var bottomLeftWeight = [
        [1, 2, 4, 8],
        [128, 64, 32, 16],
        [256, 512, 1024, 2048],
        [32768, 16384, 8192, 4096]
    ];
    var bottomRightWeight = [
        [8, 16, 2048, 4096],
        [4, 32, 1024, 8192],
        [2, 64, 512, 16384],
        [1, 128, 256, 32768]
    ];
    amounts.push(getScore(topLeftWeight, gameBoard));
    amounts.push(getScore(bottomLeftWeight, gameBoard));
    amounts.push(getScore(topRightWeight, gameBoard));
    amounts.push(getScore(bottomRightWeight, gameBoard));
    var maxScore = amounts[0];
    for (var i = 1; i < amounts.length; i++)
        maxScore = Math.max(maxScore, amounts[i]);
    return maxScore;
};

function getScore(matrix, gameBoard) {
    var score = 0;
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            var value;
            if (gameBoard.cells[i][j] === null) value = 0;
            else value = gameBoard.cells[i][j].value;
            score += matrix[i][j] * value;
        }
    }
    return score;
}