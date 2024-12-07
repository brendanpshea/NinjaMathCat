// game.js
class Game {
    constructor() {
        // ... keep existing canvas setup ...
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 600;
        this.canvas.height = 300;
        
        // ... keep existing null initializations ...
        this.player = null;
        this.monster = null;
        this.playerSprite = null;
        this.monsterSprite = null;
        this.background = null;
        
        // ... keep existing game state variables ...
        this.currentQuestion = null;
        this.battleActive = false;
        this.grade = 0;
        this.questionCount = 0;
        this.maxQuestions = 10;

         // Initialize the image loader
    this.imageLoader = new ImageLoader();
    
    // Define image paths
    this.imagePaths = {
        background: 'assets/sprites/backgrounds/forest.png',
        ninjaCat: 'assets/sprites/characters/ninja-cat.png',
        energyBlast: 'assets/sprites/effects/energy-blast.png'
    };

    this.defeatedMonsters = 0;
    this.monsterSprites = [];
    this.currentMonsterIndex = 0;
    
    this.setupEventListeners();
    this.loadAssets();

        this.initializeGame();
        
        // Set up scaling
        this.BASE_WIDTH = 600;
        this.BASE_HEIGHT = 300;
        this.scale = 1;
        this.calculateScale();
        this.resizeCanvas();
    }

    async loadAssets() {
        try {
            // Load core game images
            await this.imageLoader.loadImages(this.imagePaths);
            
            // Load monster sprites
            this.monsterSprites = await this.imageLoader.discoverMonsterImages('assets/sprites/monsters');
            
            debug(`Loaded ${this.monsterSprites.length} monster sprites`);
            
        } catch (error) {
            console.error('Failed to load game assets:', error);
        }
    }
    
    getNextMonsterSprite() {
        if (this.monsterSprites.length === 0) return this.imagePaths.ninjaCat; // Fallback
        
        const sprite = this.monsterSprites[this.currentMonsterIndex];
        this.currentMonsterIndex = (this.currentMonsterIndex + 1) % this.monsterSprites.length;
        return sprite.src;
    }

    async initializeGame() {
        try {
            // Load core game images
            await this.imageLoader.loadImages(this.imagePaths);
            
            // Load monster sprites
            this.monsterSprites = await this.imageLoader.discoverMonsterImages('assets/sprites/monsters');
            
            debug(`Loaded ${this.monsterSprites.length} monster sprites`);
            
        } catch (error) {
            console.error('Failed to load game assets:', error);
        }
    }

    
    setupEventListeners() {
        document.getElementById('start-battle').addEventListener('click', () => this.startBattle());
        document.getElementById('grade-select').addEventListener('change', (e) => {
            this.grade = parseFloat(e.target.value);
        });
        
        document.getElementById('start-battle').addEventListener('click', () => this.startBattle());
        document.getElementById('grade-select').addEventListener('change', (e) => {
            this.grade = parseFloat(e.target.value);
        });
    
        // Add new event listener for restart button
        document.getElementById('restart-game').addEventListener('click', () => this.restartGame());
        
    
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

     // Add this new method to calculate the scale factor
    calculateScale() {
        // Get the game container's width
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        
        // Calculate scale based on container width
        // Subtract 40px to account for container padding (20px on each side)
        this.scale = Math.min(1, (containerWidth - 40) / this.BASE_WIDTH);
    }

    // Add this new method to handle canvas resizing
    resizeCanvas() {
        this.calculateScale();
        
        // Reset the transform before scaling
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Apply the new dimensions
        this.canvas.width = Math.floor(this.BASE_WIDTH * this.scale);
        this.canvas.height = Math.floor(this.BASE_HEIGHT * this.scale);
        
        // Scale the context to maintain proper rendering
        this.ctx.scale(this.scale, this.scale);
        
        // Redraw the game state
        this.drawSprites();
    }
    
    // Modify the existing handleResize method
    handleResize() {
        this.resizeCanvas();
    }

    startBattle() {
        this.battleActive = true;
        this.questionCount = 0;
        this.player = new Player('Math Ninja', 1);
        this.monster = new Monster('WOLF', 1);

         // Show the restart button when battle starts
        document.getElementById('restart-button-container').classList.add('visible');
        
        // Create background and sprites
        this.background = new Background(this.canvas, this.imagePaths.background);
        
        this.playerSprite = new Sprite(
            this.canvas,
            50,  // x position
            100, // y position
            100, // width
            100, // height
            this.imagePaths.ninjaCat
        );
        
        this.monsterSprite = new Sprite(
            this.canvas,
            450, // x position
            100, // y position
            100, // width
            100, // height
            this.getNextMonsterSprite()
        );
        
        // Reset UI
        document.getElementById('start-battle').textContent = 'Restart Battle';
        this.updateHealthDisplays();
        this.drawSprites();
        this.generateQuestion();
    }

    generateQuestion() {
        this.questionCount++;
        this.currentQuestion = QuestionFactory.generate(this.grade);
        this.displayQuestion();
    }

    displayQuestion() {
        const questionText = document.getElementById('question-text');
        const answersDiv = document.getElementById('answers');
        
        questionText.textContent = `${this.currentQuestion.questionText}`;
        answersDiv.innerHTML = '';
        
        this.currentQuestion.getAllAnswers().forEach(answer => {
            const button = Utils.createElement('button', 'answer-button');
            button.textContent = answer;
            button.addEventListener('click', () => this.handleAnswer(answer));
            answersDiv.appendChild(button);
        });
    }

    async handleAnswer(answer) {
        if (!this.battleActive) return;
    
        const correct = this.currentQuestion.isCorrect(answer);
        const buttons = document.querySelectorAll('.answer-button');
        buttons.forEach(btn => btn.disabled = true);
    
        const feedbackText = document.getElementById('feedback-text');
    
        if (!correct) {
            // Retrieve the correct answer
            const correctAnswer = this.currentQuestion.getCorrectAnswer();
    
            // Display incorrect feedback with the correct answer
            feedbackText.textContent = `❌ Incorrect! The correct answer is ${correctAnswer}.`;
            feedbackText.classList.remove('correct-feedback'); // Ensure correct-feedback class is removed
            feedbackText.classList.add('incorrect-feedback'); // Add incorrect-feedback class for styling
    
            // Trigger monster attack and handle player damage
            await this.monsterAttack();
            this.handlePlayerDamage();
        } else {
            // No feedback for correct answers
            // Proceed with player attack and handle monster damage
            await this.playerAttack();
            this.handleMonsterDamage();
        }
    
        this.updateHealthDisplays();
    
        if (this.checkBattleEnd()) return;
    
        // Generate next question or end battle if max questions reached
        if (this.questionCount >= this.maxQuestions) {
            this.endBattle('Battle Complete!');
            return;
        }
    
        // Generate next question after a short delay
        setTimeout(() => {
            feedbackText.textContent = ''; // Clear feedback
            buttons.forEach(btn => btn.disabled = false);
            this.generateQuestion();
        }, 1500);
    }
    

    async playerAttack() {
        return new Promise(resolve => {
            this.playerSprite.attack();
            
            const blast = new EnergyBlast(
                this.canvas,
                this.playerSprite.x + this.playerSprite.width,
                this.playerSprite.y + this.playerSprite.height/2,
                this.monsterSprite.x,
                this.monsterSprite.y + this.monsterSprite.height/2,
                this.imagePaths.energyBlast
            );
            
            blast.fire(() => {
                this.monsterSprite.takeDamage();
                resolve();
            });
        });
    }

    async monsterAttack() {
        return new Promise(resolve => {
            this.monsterSprite.attack();
            
            const blast = new EnergyBlast(
                this.canvas,
                this.monsterSprite.x,
                this.monsterSprite.y + this.monsterSprite.height/2,
                this.playerSprite.x + this.playerSprite.width,
                this.playerSprite.y + this.playerSprite.height/2,
                this.imagePaths.energyBlast
            );
            
            blast.fire(() => {
                this.playerSprite.takeDamage();
                resolve();
            });
        });
    }

    handleMonsterDamage() {
        const damage = this.player.calculateDamage(this.currentQuestion.difficulty);
        const defeated = this.monster.takeDamage(damage);
        
        if (defeated) {
            const leveledUp = this.player.gainExperience(this.monster.experienceValue);
            if (leveledUp) this.handleLevelUp();
        }
    }

    handlePlayerDamage() {
        const damage = this.monster.calculateDamage(this.currentQuestion.difficulty);
        this.player.takeDamage(damage);
    }

    handleLevelUp() {
        const levelDiv = document.getElementById('player-level');
        levelDiv.textContent = `Level: ${this.player.level}`;
        levelDiv.classList.add('level-up');
        setTimeout(() => levelDiv.classList.remove('level-up'), 1000);
        
        // Update player stats display
        this.updateHealthDisplays();
    }

    updateHealthDisplays() {
        const playerHealth = document.getElementById('player-health');
        const monsterHealth = document.getElementById('monster-health');
        
        playerHealth.style.width = `${this.player.getHealthPercentage()}%`;
        monsterHealth.style.width = `${this.monster.getHealthPercentage()}%`;
        
        // Update health text if you have it
        playerHealth.setAttribute('data-health', 
            `${Math.ceil(this.player.currentHealth)}/${this.player.maxHealth}`);
        monsterHealth.setAttribute('data-health',
            `${Math.ceil(this.monster.currentHealth)}/${this.monster.maxHealth}`);
    }

    drawSprites() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.background) this.background.draw();
        if (this.playerSprite) this.playerSprite.draw();
        if (this.monsterSprite) this.monsterSprite.draw();
    }

    checkBattleEnd() {
        if (this.monster.currentHealth <= 0) {
            this.defeatedMonsters++;
            // Create new monster with increasing strength based on defeats
            const level = Math.floor(this.defeatedMonsters / this.monsterSprites.length) + 1;
            this.monster = new Monster('Monster', level);
            this.monsterSprite = new Sprite(
                this.canvas,
                450, // x position
                100, // y position
                100, // width
                100, // height
                this.getNextMonsterSprite()
            );
            this.updateDefeatedCounter();
            this.updateHealthDisplays();
            return false; // Continue battle with new monster
        }

        if (this.player.currentHealth <= 0) {
            this.endBattle('Defeat! 😢');
            return true;
        }
        return false;
    }

    endBattle(message) {
        this.battleActive = false;
        document.getElementById('question-text').textContent = message;
        document.getElementById('answers').innerHTML = '';
        document.getElementById('start-battle').textContent = 'Start New Battle!';
        
        // Save high score or other stats here if needed
    }

    // Animation loop for continuous rendering if needed
    animate() {
        if (this.battleActive) {
            this.drawSprites();
        }
        requestAnimationFrame(() => this.animate());
    }

    
    // New method to handle game restart
    restartGame() {
        // First, clean up the current game state
        this.battleActive = false;
        this.questionCount = 0;
        this.defeatedMonsters = 0;
        this.currentMonsterIndex = 0;
        
        // Hide the restart button
        document.getElementById('restart-button-container').classList.remove('visible');
        
        // Reset the battle UI elements
        document.getElementById('question-text').textContent = '';
        document.getElementById('answers').innerHTML = '';
        document.getElementById('start-battle').textContent = 'Start Adventure!';
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset object references
        this.player = null;
        this.monster = null;
        this.playerSprite = null;
        this.monsterSprite = null;
        this.background = null;
        
        // Show the welcome screen elements again
        document.getElementById('welcome-header').style.display = 'block';
        document.getElementById('start-section').style.display = 'block';
        document.getElementById('ninja-cat-image').style.display = 'block';
        document.getElementById('battle-scene').style.display = 'none';
        document.getElementById('question-area').style.display = 'none';
    }

    // Add this method to your Game class
updateDefeatedCounter() {
    const counterElement = document.getElementById('monsters-defeated');
    if (counterElement) {
        counterElement.textContent = `Monsters Defeated: ${this.defeatedMonsters}`;
    }
}
}


// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    window.game.animate(); // Start animation loop
});