// This code runs the simulation and sends the selected moves to the game
function AgentManager(gameManager) {
    this.gameManager = gameManager;
    this.agent = new Agent();
    this.moveCount = 0;

    this.start = Date.now();

    this.totalGames = 20;
    this.numPlayed = 0;
    this.wins = 0;
    this.doublewins = 0;
    this.triplewins = 0;
    this.totalScore = 0;
    this.maxScore = 0;

    this.twentyfortyeight = false;
    this.fortyninetysix = false;
    this.eightyoneninetytwo = false;
};

AgentManager.prototype.selectMove = function () {
    // 0: up, 1: right, 2: down, 3: left
    //if (this.gameManager.over) setTimeout(this.gameManager.restart.bind(this.gameManager), 1000);
    //else
    //    if (!this.gameManager.move(this.agent.selectMove(this.gameManager))) console.log("bad move");

    

    // game over
    if (this.gameManager.over) {
        console.log(this.gameManager.score + " in " + this.moveCount + " moves.");

        this.totalScore += this.gameManager.score;

        if (this.gameManager.score > this.maxScore) this.maxScore = this.gameManager.score;

        this.moveCount = 0;
        if (this.twentyfortyeight) this.wins++;
        if (this.fortyninetysix) this.doublewins++;
        if (this.eightyoneninetytwo) this.triplewins++;

        this.twentyfortyeight = false;
        this.fortyninetysix = false;
        this.eightyoneninetytwo = false;

        this.numPlayed++;
        var delay = Date.now() - this.start;
        if (delay > 900000) {
            console.log(this.numPlayed + " games played in " + delay + "ms.");
            console.log("2048: " + this.wins + " 4096: " + this.doublewins + " 8192: " + this.triplewins);
            console.log("Average Score: " + this.totalScore / this.numPlayed + " Max Score: " + this.maxScore);
        }
        else {
            setTimeout(this.gameManager.restart.bind(this.gameManager), 1000);
        }
    } else { // game ongoing
        if (this.gameManager.won && !this.gameManager.keepPlaying) {
            this.gameManager.keepplaying();
            this.selectMove();
            this.twentyfortyeight = true;
        }
        else {
            if (!this.gameManager.move(this.agent.selectMove(this.gameManager))) console.log("bad move");
            else this.moveCount++;

            var that = this;
            this.gameManager.grid.eachCell(function (x, y, cell) {
                if (cell) {
                    if (cell.value === 2048) that.twentyfortyeight = true;
                    if (cell.value === 4096) that.fortyninetysix = true;
                    if (cell.value === 8192) that.eightyoneninetytwo = true;
                }
            });
        }
    }
};