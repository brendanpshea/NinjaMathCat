// game.js
import { UIManager, IMAGE_PATHS } from './ui_manager.js';
import QuestionFactory from './question_factory.js';
import { Sprite, Background, EnergyBlast } from './sprites.js';

class Game {
    constructor(debugMode = true) {
        this.debugMode = debugMode;        
        this.battleActive = false;
        this.ui = new UIManager(this);
        this.canvas = this.ui.getCanvas();
        this.ctx = this.ui.getContext();

        this.player = null;
        this.monster = null;
        this.playerSprite = null;
        this.monsterSprite = null;
        this.background = null;

        this.currentQuestion = null;
        this.grade = 0;
        this.questionCount = 0;
        this.maxQuestions = 100;
        this.defeatedMonsters = 0;

        this.monsterSprites = [];
        this.currentMonsterIndex = 0;

        this.backgroundSprites = [];
        this.currentBackgroundIndex = 0;

        this.monsterBlastSprites = [];
        this.currentMonsterBlastIndex = 0;

        this.playerBlastSprites = [];
        this.playerBlastSprite = null;

        this.imageLoader = new ImageLoader();
        this.imagePaths = IMAGE_PATHS;

        this.lastTimestamp = performance.now(); // used for calculating delta time

        this.initializeGame();
    }

    update(deltaTime) {
        // Update game logic here. For example:
        // Move sprites if needed, update animation counters, etc.
        // Example:
        // if (this.playerSprite) this.playerSprite.update(deltaTime);
        // if (this.monsterSprite) this.monsterSprite.update(deltaTime);
    }

    animate(timestamp) {
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        if (this.battleActive) {
            this.update(deltaTime);
            this.drawSprites();
        }

        requestAnimationFrame((t) => this.animate(t));
    }

    log(message, level = 'log') {
        if (!this.debugMode && level === 'debug') return;
        const logger = console[level] || console.log;
        logger(`[${level.toUpperCase()}] ${message}`);
    }


    async initializeGame() {
        this.log('Imported QuestionFactory:' + QuestionFactory, 'debug');

        try {
            await this.imageLoader.loadImages(this.imagePaths);
            this.monsterSprites = await this.imageLoader.discoverMonsterImages('assets/sprites/monsters');
            this.backgroundSprites = await this.imageLoader.discoverBackgroundImages('assets/sprites/backgrounds');
            this.monsterBlastSprites = await this.imageLoader.discoverMonsterBlastImages('assets/sprites/effects');
            this.playerBlastSprites = await this.imageLoader.discoverPlayerBlastImages('assets/sprites/effects');

            this.log(`Loaded ${this.monsterSprites.length} monster sprites`, 'debug');
            this.log(`Loaded ${this.backgroundSprites.length} background sprites`, 'debug');
            this.log(`Loaded ${this.monsterBlastSprites.length} monster blast sprites`, 'debug');
            this.log(`Loaded ${this.playerBlastSprites.length} player blast sprites`, 'debug');
        } catch (error) {
            this.log('Failed to load game assets: ' + error, 'error');
        }
    }

    getNextSprite(spriteArray, currentIndexProperty, fallbackPath) {
        if (spriteArray.length === 0) return fallbackPath;
        if (this[currentIndexProperty] >= spriteArray.length) this[currentIndexProperty] = 0;
        const sprite = spriteArray[this[currentIndexProperty]].src;
        this[currentIndexProperty]++;
        return sprite;
    }

    getPlayerBlastSpriteForLevel(level) {
        if (this.playerBlastSprites.length === 0) return this.imagePaths.energyBlast;
        const index = (level - 1) % this.playerBlastSprites.length;
        return this.playerBlastSprites[index].src;
    }

    startBattle() {
        this.log('Starting battle with grade: ' + this.grade, 'info');
        this.battleActive = true;
        this.questionCount = 0;
        this.player = new Player('Math Ninja', 1);
        this.monster = new Monster('WOLF', 1);

        this.ui.showRestartButton();
        this.ui.showBattleScene();

        this.playerBlastSprite = this.getPlayerBlastSpriteForLevel(this.player.level);
        this.background = new Background(this.canvas, this.getNextSprite(this.backgroundSprites, 'currentBackgroundIndex', this.imagePaths.background));
        this.playerSprite = new Sprite(this.canvas, 50, 100, 100, 100, this.imagePaths.ninjaCat);
        this.monsterSprite = new Sprite(this.canvas, 450, 100, 100, 100, this.getNextSprite(this.monsterSprites, 'currentMonsterIndex', this.imagePaths.ninjaCat));

        this.monsterBlastSprite = this.getNextSprite(this.monsterBlastSprites, 'currentMonsterBlastIndex', this.imagePaths.energyBlast);

        this.ui.updateStartButton('Restart Battle');
        this.ui.updateHealthDisplays(this.player, this.monster);
        this.drawSprites();
        this.generateQuestion();
    }

    async handleAnswer(answer) {
        if (!this.battleActive) return;
        if (!this.currentQuestion) {
            this.log('No current question available', 'error');
            return;
        }

        const buttons = document.querySelectorAll('.answer-button');
        buttons.forEach(btn => (btn.disabled = true));

        const correct = this.currentQuestion.isCorrect(answer);
        if (!correct) {
            const correctAnswer = this.currentQuestion.getCorrectAnswer();
            this.ui.showFeedback(`❌ Incorrect! The correct answer is ${correctAnswer}.`, false);
            await this.monsterAttack();
            this.handlePlayerDamage();
        } else {
            await this.playerAttack();
            this.handleMonsterDamage();
        }

        this.ui.updateHealthDisplays(this.player, this.monster);

        if (this.checkBattleEnd()) return;

        if (this.questionCount >= this.maxQuestions) {
            this.endBattle('Battle Complete!');
            return;
        }

        setTimeout(() => {
            if (!this.battleActive) return;
            this.ui.clearFeedback();
            buttons.forEach(btn => (btn.disabled = false));
            this.generateQuestion();
        }, 1500);
    }

    generateQuestion() {
        if (!this.battleActive) return;
        this.questionCount++;
        this.log('Generating question for grade: ' + this.grade, 'debug');

        const newQuestion = QuestionFactory.generate(this.grade);
        if (!newQuestion) {
            this.log('Failed to generate question', 'error');
            return;
        }

        this.currentQuestion = newQuestion;
        this.ui.displayQuestion(this.currentQuestion, answer => this.handleAnswer(answer));
    }

    async monsterAttack() {
        return new Promise(resolve => {
            this.monsterSprite.attack();
            const blast = new EnergyBlast(
                this.canvas,
                this.monsterSprite.x,
                this.monsterSprite.y + this.monsterSprite.height / 2,
                this.playerSprite.x + this.playerSprite.width,
                this.playerSprite.y + this.playerSprite.height / 2,
                this.monsterBlastSprite
            );

            blast.fire(() => {
                this.playerSprite.takeDamage();
                resolve();
            });
        });
    }

    async playerAttack() {
        return new Promise(resolve => {
            this.playerSprite.attack();
            const blast = new EnergyBlast(
                this.canvas,
                this.playerSprite.x + this.playerSprite.width,
                this.playerSprite.y + this.playerSprite.height / 2,
                this.monsterSprite.x,
                this.monsterSprite.y + this.monsterSprite.height / 2,
                this.playerBlastSprite
            );

            blast.fire(() => {
                this.monsterSprite.takeDamage();
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
        this.ui.updatePlayerLevel(this.player.level);
        this.ui.updateHealthDisplays(this.player, this.monster);
        this.ui.showLevelUpNotification(this.player.level);
        this.playerBlastSprite = this.getPlayerBlastSpriteForLevel(this.player.level);
    }

    drawSprites() {
        // One unified clearing here:
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
        if (this.background) this.background.draw();
        if (this.playerSprite) this.playerSprite.draw();
        if (this.monsterSprite) this.monsterSprite.draw();
    }

    checkBattleEnd() {
        if (this.monster.currentHealth <= 0) {
            this.defeatedMonsters++;
            this.ui.showFeedback('🎉 Victory! Monster defeated! Get ready for the next battle...', true);

            const level = Math.floor(this.defeatedMonsters / 3) + 1;

            setTimeout(() => {
                this.ui.clearFeedback();
                this.monster = new Monster('Monster', level);
                this.monsterSprite = new Sprite(
                    this.canvas,
                    450,
                    100,
                    100,
                    100,
                    this.getNextSprite(this.monsterSprites, 'currentMonsterIndex', this.imagePaths.ninjaCat)
                );
                this.monsterBlastSprite = this.getNextSprite(this.monsterBlastSprites, 'currentMonsterBlastIndex', this.imagePaths.energyBlast);
                this.background = new Background(this.canvas, this.getNextSprite(this.backgroundSprites, 'currentBackgroundIndex', this.imagePaths.background));

                this.ui.updateDefeatedCounter(this.defeatedMonsters);
                this.ui.updateHealthDisplays(this.player, this.monster);
            }, 2000);

            return false;
        }

        if (this.player.currentHealth <= 0) {
            this.endBattle('Defeat! 😢');
            return true;
        }
        return false;
    }

    endBattle(message) {
        this.battleActive = false;
        this.ui.showFeedback(message, false);
        this.ui.clearAnswers();
        this.ui.updateStartButton('Start New Battle!');
    }

    animate() {
        if (this.battleActive) this.drawSprites();
        requestAnimationFrame(() => this.animate());
    }

    restartGame() {
        this.log('Restarting game...', 'info');
        this.battleActive = false;
        this.questionCount = 0;
        this.defeatedMonsters = 0;
        this.currentMonsterIndex = 0;
        this.grade = 0;

        this.ui.hideRestartButton();
        this.ui.resetGameUI();
        this.ui.clearCanvas();

        this.player = null;
        this.monster = null;
        this.playerSprite = null;
        this.monsterSprite = null;
        this.background = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.game = game;
    game.animate();

    const stressTestButton = document.getElementById('stress-test-button');
    if (stressTestButton) {
        stressTestButton.addEventListener('click', async () => {
            console.log('Starting stress test...');
            try {
                await QuestionFactory.stressTest();
            } catch (error) {
                console.error('Stress test failed:', error);
            }
        });
    }
});

export default Game;