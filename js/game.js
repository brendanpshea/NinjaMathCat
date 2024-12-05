// game.js
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 600;
        this.canvas.height = 300;
        
        this.player = null;
        this.monster = null;
        this.playerSprite = null;
        this.monsterSprite = null;
        this.background = null;
        
        this.currentQuestion = null;
        this.battleActive = false;
        this.grade = 0;
        this.questionCount = 0;
        this.maxQuestions = 10;  // Questions per battle
        
        // Define image paths
        this.imagePaths = {
            background: 'assets/sprites/backgrounds/forest.png',
            ninjaCat: 'assets/sprites/characters/ninja-cat.png',
            wolf: 'assets/sprites/characters/wolf.png',
            energyBlast: 'assets/sprites/effects/energy-blast.png'
        };
        
        this.setupEventListeners();
        this.loadImages();
    }

    loadImages() {
        this.preloadedImages = {};
        Object.entries(this.imagePaths).forEach(([key, path]) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                this.preloadedImages[key] = img;
                debug(`Loaded image: ${key}`);
            };
        });
    }

    setupEventListeners() {
        document.getElementById('start-battle').addEventListener('click', () => this.startBattle());
        document.getElementById('grade-select').addEventListener('change', (e) => {
            this.grade = parseFloat(e.target.value);
        });
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        // Could add responsive canvas sizing here if needed
        this.drawSprites();
    }

    startBattle() {
        this.battleActive = true;
        this.questionCount = 0;
        this.player = new Player('Math Ninja', 1);
        this.monster = new Monster('WOLF', 1);
        
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
            this.imagePaths.wolf
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
        
        questionText.textContent = `Question ${this.questionCount}/${this.maxQuestions}: ${this.currentQuestion.questionText}`;
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
        
        if (correct) {
            await this.playerAttack();
            this.handleMonsterDamage();
        } else {
            await this.monsterAttack();
            this.handlePlayerDamage();
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
            this.endBattle('Victory! 🎉');
            return true;
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
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    window.game.animate(); // Start animation loop
});