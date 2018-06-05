(function (global) {

    // common game constants and variables
    const GameWorld = {
        CELL_WIDTH : 101, 
        CELL_HEIGHT : 83,
        COLS_NUM : 5,
        ROWS_NUM : 6,
        ENEMIES_ROWS_NUM : 3, // number of roads with enemies
        WATER_SCORE : 10,
        scoreDiv : document.querySelector('.scores'),
        activeHearts : document.querySelectorAll('.health li.active'),
        restartBut :document.querySelector('.restart'),
        isFinished : false
    };

    /**
    * @description Returns random value between 1 and number of roads with enemies
    */
    function getRandom () {
        return Math.floor(Math.random() * GameWorld.ENEMIES_ROWS_NUM) + 1;
    }

    /**
    * @description Represents abstract game entity
    * @constructor
    * @param {object} attrs - attributes 
    * @param {number} attrs.col - number of current column, starting with 0
    * @param {number} attrs.row - number of current row, starting with 0
    * @param {string} attrs.sprite - path to image
    * @param {number} attrs.offsetY - offset to correct visual position of the image along the y axis 
    */
    const GameEntity = function (attrs) {
        this.col = attrs.col || 0;          
        this.row = attrs.row || 0;         
        this.sprite = attrs.sprite;   
        this.offsetY = attrs.offsetY || 0;
        this.attrs = attrs;          
    }

    /**
    * @description Returns actual x-coordinates based on current column
    */
    GameEntity.prototype.getXCoords = function () {
        return this.col * GameWorld.CELL_WIDTH;
    }

    /**
    * @description Returns actual y-coordinates based on current row
    */
    GameEntity.prototype.getYCoords = function () {
        return this.row * GameWorld.CELL_HEIGHT - this.offsetY;
    };
 
    /**
    * @description Draw game entity on the screen
    */
    GameEntity.prototype.render = function () {
        const x = this.getXCoords();
        const y = this.getYCoords();
        ctx.drawImage(Resources.get(this.sprite), x, y);
    }

    /**
    * @description Represents enemy, extends GameEntity
    * @constructor
    * @param {object} attrs - attributes
    * @param {object} attrs - attributes 
    * @param {number} attrs.col - number of current column, starting with 0
    * @param {number} attrs.row - number of current row, starting with 0
    * @param {string} attrs.sprite - path to image
    * @param {number} attrs.offsetY - offset to correct visual position of the image along the y axis
    * @param {number} attrs.speed - enemy speed
    */
    const Enemy = function (attrs) {
        if (!('sprite' in attrs)) attrs.sprite = 'images/enemy-bug.png';
        if (!('offsetY' in attrs)) attrs.offsetY = 20;
        if (!('speed' in attrs)) attrs.speed = Enemy.SPEED_NORMAL;     
        GameEntity.call(this, attrs);
    };

    Enemy.prototype = Object.create(GameEntity.prototype);
    Enemy.prototype.constructor = Enemy;

    // Enemies speed
    Enemy.SPEED_FAST = 2;
    Enemy.SPEED_NORMAL = 1;
    Enemy.SPEED_SLOW = 0.5;

    /**
    * @description Updates the enemy's position
    * @param {number} dt - a time delta between ticks, multiply any movement by the dt parameter
    * to ensure the game runs at the same speed for all computers.
    */
    Enemy.prototype.update = function (dt) {
        this.col += this.attrs.speed * dt;
        if (this.col > GameWorld.COLS_NUM) {
            this.col = 0;
            this.row = getRandom();
        }
    }

    /**
    * @description Represents player, extends GameEntity
    * @constructor
    * @param {object} attrs - attributes
    * @param {object} attrs - attributes 
    * @param {object} attrs - attributes 
    * @param {number} attrs.col - number of current column, starting with 0
    * @param {number} attrs.row - number of current row, starting with 0
    * @param {string} attrs.sprite - path to image
    * @param {number} attrs.offsetY - offset to correct visual position of the image along the y axis
    */
    const Player = function (attrs) {
        if (!('sprite' in attrs)) attrs.sprite = 'images/char-boy.png';
        if (!('offsetY' in attrs)) attrs.offsetY = 10;
        GameEntity.call(this, attrs);
        this.finalRow = 0;
        this.startCol = this.col;
        this.startRow = this.row;
        this.score = 0;
        this.health = Player.START_HEALTH;
    };

    Player.prototype = Object.create(GameEntity.prototype);
    Player.prototype.constructor = Player;

    // Player initial health
    Player.START_HEALTH = 3;
    
    /**
    * @description Replace player to the start position
    */
    Player.prototype.reset = function () {
        this.col = this.startCol;
        this.row = this.startRow;
    }

    /**
    * @description Restart game for player 
    */
    Player.prototype.restart = function () {
        this.reset();
        this.health = Player.START_HEALTH;
        this.score = 0;
    }

    /**
    * @description Handles player collision with enemy: decreases health, replace the player
    */
    Player.prototype.meetEnemy = function () {
        this.health --;       
        if (this.health == 2) {
            GameWorld.activeHearts[0].classList.remove('active');
        } else if (this.health == 1) {
            GameWorld.activeHearts[1].classList.remove('active');
        } else if (this.health == 0) {
            GameWorld.activeHearts[2].classList.remove('active');
        } else {
            showGameOverModal(this.score);
        }
        this.reset();
    }

    /**
    * @description Checks collisions player with enemies
    */
    Player.prototype.update = function () {
        for (var i = 0; i < allEnemies.length; i++) {
            if (allEnemies[i].col > this.col - 0.5 && allEnemies[i].col < this.col + 0.5  && allEnemies[i].row == this.row ) {
                this.meetEnemy();
            }
        }
    }

    /**
    * @description Handles player got to water: increases score, resets player's position
    */
    Player.prototype.getToWater = function () {
        this.score += GameWorld.WATER_SCORE;
        GameWorld.scoreDiv.innerHTML = 'Score: ' + this.score;
        this.reset();
    }

    /**
    * @description Moves player up 
    */
    Player.prototype.up = function () {
        this.row--;
        if (this.row <= 0) {
            this.getToWater();
        }
    }

    /**
    * @description Moves player down 
    */
    Player.prototype.down = function () {
        const newRow = this.row + 1;
        if (newRow < GameWorld.ROWS_NUM) {
           this.row = newRow; 
        }
    }

    /**
    * @description Moves player right 
    */
    Player.prototype.right = function () {
        const newCol = this.col + 1;
        if (newCol < GameWorld.COLS_NUM) {
           this.col = newCol; 
        }
    }

    /**
    * @description Moves player left 
    */
    Player.prototype.left = function () {
        const newCol = this.col - 1;
        if (newCol >= 0) {
           this.col = newCol; 
        }
    }

    /**
    * @description Handles user arrows keys presses
    * @param {string} arrow 
    */
    Player.prototype.handleInput = function (arrow) {
        if (!arrow) return;
        this[arrow]();
    }

    // Instantiate objects.
    const player = new Player({col: 2, row: 5});

    var allEnemies = [
        new Enemy({col: 0, row: 1, speed: Enemy.SPEED_NORMAL}),
        new Enemy({col: 0, row: 2, speed: Enemy.SPEED_FAST}),
        new Enemy({col: 0, row: 3, speed: Enemy.SPEED_SLOW}),
        new Enemy({col: 0, row: 3, speed: Enemy.SPEED_NORMAL})
    ];
   
    /**
    * @description listens for key presses and sends the keys to Player.handleInput() method
    */
    document.addEventListener('keyup', function (e) {
        if (GameWorld.isFinished) {
            return;
        }
        const allowedKeys = {
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down'
        };

        player.handleInput(allowedKeys[e.keyCode]);
    });

    /**
    * @description Restarts game: resets scores and sets health
    */
    GameWorld.restartBut.addEventListener('click', function() { 
        GameWorld.scoreDiv.innerHTML = 'Score: ' + 0;
        for (let i = 0; i < GameWorld.activeHearts.length; i++) {
            GameWorld.activeHearts[i].classList.add('active');
        }
        closeGameOverModal();
        GameWorld.isFinished = false;
        player.restart();
    });

    /**
    * @description Show game over modal window
    * @param {number} scores 
    */
    function showGameOverModal(scores) {
        let modalScore = document.querySelector('.modal-score');
        modalScore.innerHTML = `With ${scores} scores`;  
        let message = document.querySelector('.modal');
        message.classList.add('modal-active');
        GameWorld.isFinished = true;
    }

    /**
    * @description Close modal window 
    */
    function closeGameOverModal() {
        let message = document.querySelector('.modal');
        message.classList.remove('modal-active');
    }

    global.player = player;
    global.allEnemies = allEnemies;

})(window);
