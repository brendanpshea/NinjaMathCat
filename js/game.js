// game.js
// Description: Main game logic and rendering for the Math Ninja game.

import QuestionFactory from './question_factory.js';

// Constants for image paths and selectors
const IMAGE_PATHS = {
    background: 'assets/sprites/backgrounds/forest.png',
    ninjaCat: 'assets/sprites/characters/ninja-cat.png',
    energyBlast: 'assets/sprites/effects/energy-blast.png'
};

const SELECTORS = {
    canvas: 'game-canvas',
    startBattleButton: 'start-battle',
    gradeSelect: 'grade-select',
    restartGameButton: 'restart-game',
    restartButtonContainer: 'restart-button-container',
    gameContainer: 'game-container',
    welcomeHeader: 'welcome-header',
    startSection: 'start-section',
    ninjaCatImage: 'ninja-cat-image',
    battleScene: 'battle-scene',
    questionArea: 'question-area',
    questionText: 'question-text',
    answers: 'answers',
    playerHealth: 'player-health',
    monsterHealth: 'monster-health',
    playerLevel: 'player-level',
    monstersDefeated: 'monsters-defeated',
    feedbackText: 'feedback-text'
};

class Game {
    constructor() {
        this.canvas = document.getElementById(SELECTORS.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.BASE_WIDTH = 600;
        this.BASE_HEIGHT = 300;
        this.canvas.width = this.BASE_WIDTH;
        this.canvas.height = this.BASE_HEIGHT;

        // Game entities
        this.player = null;
        this.monster = null;
        this.playerSprite = null;
        this.monsterSprite = null;
        this.background = null;

        // Game state
        this.currentQuestion = null;
        this.battleActive = false;
        this.grade = 0;
        this.questionCount = 0;
        this.maxQuestions = 100;
        this.defeatedMonsters = 0;
        this.monsterSprites = [];
        this.currentMonsterIndex = 0;

          // Add new properties for background management
          this.backgroundSprites = [];
          this.currentBackgroundIndex = 0;

        // Image loading
        this.imageLoader = new ImageLoader();
        this.imagePaths = IMAGE_PATHS;

        

        // Scaling
        this.scale = 1;
        this.calculateScale();
        this.resizeCanvas();

        // Setup
        this.setupEventListeners();
        this.initializeGame();
    }

    async initializeGame() {
        try {
            // Load core game images
            await this.imageLoader.loadImages(this.imagePaths);

            // Load monster sprites dynamically
            this.monsterSprites = await this.imageLoader.discoverMonsterImages('assets/sprites/monsters');
            
            // Load background sprites dynamically
            this.backgroundSprites = await this.imageLoader.discoverBackgroundImages('assets/sprites/backgrounds');

            console.debug(`Loaded ${this.monsterSprites.length} monster sprites`);
            console.debug(`Loaded ${this.backgroundSprites.length} background sprites`);
        } catch (error) {
            console.error('Failed to load game assets:', error);
        }
    }

    /**
     * Retrieves the next monster sprite in sequence.
     * @returns {string} The source path of the next monster sprite.
     */
    getNextMonsterSprite() {
        if (this.monsterSprites.length === 0) return this.imagePaths.ninjaCat; // Fallback

        // Reset index if all monsters have been cycled through
        if (this.currentMonsterIndex >= this.monsterSprites.length) {
            this.currentMonsterIndex = 0;
        }

        return this.monsterSprites[this.currentMonsterIndex++].src;
    }

        /**
     * Retrieves the next background sprite in sequence.
     * @returns {string} The source path of the next background sprite.
     */
        getNextBackgroundSprite() {
            if (this.backgroundSprites.length === 0) return this.imagePaths.background; // Fallback
    
            // Reset index if all backgrounds have been cycled through
            if (this.currentBackgroundIndex >= this.backgroundSprites.length) {
                this.currentBackgroundIndex = 0;
            }
    
            return this.backgroundSprites[this.currentBackgroundIndex++].src;
        }

    /**
     * Sets up all necessary event listeners.
     */
    setupEventListeners() {
        const startBattleBtn = document.getElementById(SELECTORS.startBattleButton);
        const gradeSelect = document.getElementById(SELECTORS.gradeSelect);
        const restartGameBtn = document.getElementById(SELECTORS.restartGameButton);

        startBattleBtn.addEventListener('click', () => this.startBattle());

        gradeSelect.addEventListener('change', (e) => {
            this.grade = parseFloat(e.target.value);
        });

        restartGameBtn.addEventListener('click', () => this.restartGame());

        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Calculates the scale factor based on the container's width.
     */
    calculateScale() {
        const container = document.getElementById(SELECTORS.gameContainer);
        const containerWidth = container.clientWidth;

        // Subtract 40px to account for container padding (20px on each side)
        this.scale = Math.min(1, (containerWidth - 40) / this.BASE_WIDTH);
    }

    /**
     * Resizes the canvas based on the current scale.
     */
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

    /**
     * Handles window resize events.
     */
    handleResize() {
        this.resizeCanvas();
    }

    /**
     * Starts a new battle by initializing player and monster entities.
     */
    startBattle() {
        this.battleActive = true;
        this.questionCount = 0;
        this.player = new Player('Math Ninja', 1);
        this.monster = new Monster('WOLF', 1);

        // Show the restart button when battle starts
        document.getElementById(SELECTORS.restartButtonContainer).classList.add('visible');

        // Initialize background and sprites
        this.background = new Background(this.canvas, this.getNextBackgroundSprite());

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
        const startBattleBtn = document.getElementById(SELECTORS.startBattleButton);
        startBattleBtn.textContent = 'Restart Battle';

        this.updateHealthDisplays();
        this.drawSprites();
        this.generateQuestion();
    }

    /**
     * Generates a new question based on the current grade.
     */
    generateQuestion() {
        this.questionCount++;
        this.currentQuestion = QuestionFactory.generate(this.grade);
        this.displayQuestion();
    }

    /**
     * Displays the current question and its possible answers.
     */
    displayQuestion() {
        const questionText = document.getElementById(SELECTORS.questionText);
        const answersDiv = document.getElementById(SELECTORS.answers);

        questionText.textContent = `${this.currentQuestion.questionText}`;
        answersDiv.innerHTML = '';

        this.currentQuestion.getAllAnswers().forEach(answer => {
            const button = Utils.createElement('button', 'answer-button');
            button.textContent = answer;
            button.addEventListener('click', () => this.handleAnswer(answer));
            answersDiv.appendChild(button);
        });
    }

    /**
     * Handles the user's answer selection.
     * @param {string} answer - The answer selected by the user.
     */
    async handleAnswer(answer) {
        if (!this.battleActive) return;

        const correct = this.currentQuestion.isCorrect(answer);
        const buttons = document.querySelectorAll('.answer-button');
        buttons.forEach(btn => btn.disabled = true);

        const feedbackText = document.getElementById(SELECTORS.feedbackText);

        if (!correct) {
            const correctAnswer = this.currentQuestion.getCorrectAnswer();
            feedbackText.textContent = `❌ Incorrect! The correct answer is ${correctAnswer}.`;
            feedbackText.classList.remove('correct-feedback');
            feedbackText.classList.add('incorrect-feedback');

            await this.monsterAttack();
            this.handlePlayerDamage();
        } else {
            await this.playerAttack();
            this.handleMonsterDamage();
        }

        this.updateHealthDisplays();

        if (this.checkBattleEnd()) return;

        if (this.questionCount >= this.maxQuestions) {
            this.endBattle('Battle Complete!');
            return;
        }

        // Proceed to the next question after a short delay
        setTimeout(() => {
            feedbackText.textContent = '';
            buttons.forEach(btn => btn.disabled = false);
            this.generateQuestion();
        }, 1500);
    }

    /**
     * Executes the player's attack animation and logic.
     * @returns {Promise} Resolves when the attack animation is complete.
     */
    async playerAttack() {
        return new Promise(resolve => {
            this.playerSprite.attack();

            const blast = new EnergyBlast(
                this.canvas,
                this.playerSprite.x + this.playerSprite.width,
                this.playerSprite.y + this.playerSprite.height / 2,
                this.monsterSprite.x,
                this.monsterSprite.y + this.monsterSprite.height / 2,
                this.imagePaths.energyBlast
            );

            blast.fire(() => {
                this.monsterSprite.takeDamage();
                resolve();
            });
        });
    }

    /**
     * Executes the monster's attack animation and logic.
     * @returns {Promise} Resolves when the attack animation is complete.
     */
    async monsterAttack() {
        return new Promise(resolve => {
            this.monsterSprite.attack();

            const blast = new EnergyBlast(
                this.canvas,
                this.monsterSprite.x,
                this.monsterSprite.y + this.monsterSprite.height / 2,
                this.playerSprite.x + this.playerSprite.width,
                this.playerSprite.y + this.playerSprite.height / 2,
                this.imagePaths.energyBlast
            );

            blast.fire(() => {
                this.playerSprite.takeDamage();
                resolve();
            });
        });
    }

    /**
     * Handles damage dealt to the monster and checks for level-ups.
     */
    handleMonsterDamage() {
        const damage = this.player.calculateDamage(this.currentQuestion.difficulty);
        const defeated = this.monster.takeDamage(damage);

        if (defeated) {
            const leveledUp = this.player.gainExperience(this.monster.experienceValue);
            if (leveledUp) this.handleLevelUp();
        }
    }

    /**
     * Handles damage dealt to the player.
     */
    handlePlayerDamage() {
        const damage = this.monster.calculateDamage(this.currentQuestion.difficulty);
        this.player.takeDamage(damage);
    }

    /**
     * Handles the player's level-up process.
     */
    handleLevelUp() {
        const levelDiv = document.getElementById(SELECTORS.playerLevel);
        levelDiv.textContent = `Level: ${this.player.level}`;
        levelDiv.classList.add('level-up');
        setTimeout(() => levelDiv.classList.remove('level-up'), 1000);

        this.grade = this.grade + 0.5;

        // Update player stats display
        this.updateHealthDisplays();
    }

    /**
     * Updates the health bars for both player and monster.
     */
    updateHealthDisplays() {
        const playerHealth = document.getElementById(SELECTORS.playerHealth);
        const monsterHealth = document.getElementById(SELECTORS.monsterHealth);

        playerHealth.style.width = `${this.player.getHealthPercentage()}%`;
        monsterHealth.style.width = `${this.monster.getHealthPercentage()}%`;

        playerHealth.setAttribute('data-health', 
            `${Math.ceil(this.player.currentHealth)}/${this.player.maxHealth}`);
        monsterHealth.setAttribute('data-health',
            `${Math.ceil(this.monster.currentHealth)}/${this.monster.maxHealth}`);
    }

    /**
     * Draws all sprites onto the canvas.
     */
    drawSprites() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.background) this.background.draw();
        if (this.playerSprite) this.playerSprite.draw();
        if (this.monsterSprite) this.monsterSprite.draw();
    }

    /**
     * Checks if the battle has ended due to defeat or victory.
     * @returns {boolean} True if the battle has ended, otherwise false.
     */
    checkBattleEnd() {
        if (this.monster.currentHealth <= 0) {
            this.defeatedMonsters++;
            
            // Show victory message
            const feedbackText = document.getElementById(SELECTORS.feedbackText);
            feedbackText.textContent = `🎉 Victory! Monster defeated! Get ready for the next battle...`;
            feedbackText.classList.remove('incorrect-feedback');
            feedbackText.classList.add('correct-feedback');
            
            // Calculate level based on total monsters defeated
            const level = Math.floor(this.defeatedMonsters / 3) + 1;
            
            // Delay spawning the next monster and changing background
            setTimeout(() => {
                feedbackText.textContent = '';
                this.monster = new Monster('Monster', level);
                this.monsterSprite = new Sprite(
                    this.canvas,
                    450,
                    100,
                    100,
                    100,
                    this.getNextMonsterSprite()
                );
                // Change background for the new battle
                this.background = new Background(this.canvas, this.getNextBackgroundSprite());
                
                this.updateDefeatedCounter();
                this.updateHealthDisplays();
            }, 2000);
            
            return false;
        }
    
        if (this.player.currentHealth <= 0) {
            this.endBattle('Defeat! 😢');
            return true;
        }
        return false;
    }

    /**
     * Ends the current battle with a message.
     * @param {string} message - The message to display upon battle end.
     */
    endBattle(message) {
        this.battleActive = false;
        document.getElementById(SELECTORS.questionText).textContent = message;
        document.getElementById(SELECTORS.answers).innerHTML = '';
        document.getElementById(SELECTORS.startBattleButton).textContent = 'Start New Battle!';

        // Additional logic such as saving high scores can be added here
    }

    /**
     * The main animation loop for continuous rendering.
     */
    animate() {
        if (this.battleActive) {
            this.drawSprites();
        }
        requestAnimationFrame(() => this.animate());
    }

    /**
     * Restarts the game by resetting all game states and UI elements.
     */
    restartGame() {
        // Reset game state variables
        this.battleActive = false;
        this.questionCount = 0;
        this.defeatedMonsters = 0;
        this.currentMonsterIndex = 0;

        // Hide the restart button
        document.getElementById(SELECTORS.restartButtonContainer).classList.remove('visible');

        // Reset UI elements
        document.getElementById(SELECTORS.questionText).textContent = '';
        document.getElementById(SELECTORS.answers).innerHTML = '';
        document.getElementById(SELECTORS.startBattleButton).textContent = 'Start Adventure!';

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Reset game entities
        this.player = null;
        this.monster = null;
        this.playerSprite = null;
        this.monsterSprite = null;
        this.background = null;

        // Show the welcome screen elements
        document.getElementById(SELECTORS.welcomeHeader).style.display = 'block';
        document.getElementById(SELECTORS.startSection).style.display = 'block';
        document.getElementById(SELECTORS.ninjaCatImage).style.display = 'block';
        document.getElementById(SELECTORS.battleScene).style.display = 'none';
        document.getElementById(SELECTORS.questionArea).style.display = 'none';
    }

    /**
     * Updates the counter displaying the number of defeated monsters.
     */
    updateDefeatedCounter() {
        const counterElement = document.getElementById(SELECTORS.monstersDefeated);
        if (counterElement) {
            counterElement.textContent = `Monsters Defeated: ${this.defeatedMonsters}`;
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.game = game; // Expose game instance globally if needed
    game.animate(); // Start the animation loop
});
