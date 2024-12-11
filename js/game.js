// game.js
import { UIManager, IMAGE_PATHS } from './ui_manager.js';
import QuestionFactory from './question_factory.js';

class Game {
    constructor() {
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

        // Store the currently assigned blast sprite for the active monster
        this.monsterBlastSprite = null;

        this.imageLoader = new ImageLoader();
        this.imagePaths = IMAGE_PATHS;

        this.initializeGame();
    }

    async initializeGame() {
        console.log('Imported QuestionFactory:', QuestionFactory);

        try {
            await this.imageLoader.loadImages(this.imagePaths);
            this.monsterSprites = await this.imageLoader.discoverMonsterImages('assets/sprites/monsters');
            this.backgroundSprites = await this.imageLoader.discoverBackgroundImages('assets/sprites/backgrounds');
            // Discover monster blast images
            this.monsterBlastSprites = await this.imageLoader.discoverMonsterBlastImages('assets/sprites/effects');

            console.debug(`Loaded ${this.monsterSprites.length} monster sprites`);
            console.debug(`Loaded ${this.backgroundSprites.length} background sprites`);
            console.debug(`Loaded ${this.monsterBlastSprites.length} monster blast sprites`);
        } catch (error) {
            console.error('Failed to load game assets:', error);
        }
    }

    getNextSprite(spriteArray, indexObject, fallbackPath) {
        if (spriteArray.length === 0) return fallbackPath;
        if (indexObject.value >= spriteArray.length) indexObject.value = 0;
        return spriteArray[indexObject.value++].src;
    }

    
    getNextMonsterSprite() {
        if (this.monsterSprites.length === 0) return this.imagePaths.ninjaCat;
        if (this.currentMonsterIndex >= this.monsterSprites.length) {
            this.currentMonsterIndex = 0;
        }
        const sprite = this.monsterSprites[this.currentMonsterIndex].src;
        this.currentMonsterIndex++;
        return sprite;
    }

    getNextBackgroundSprite() {
        if (this.backgroundSprites.length === 0) return this.imagePaths.background;
        if (this.currentBackgroundIndex >= this.backgroundSprites.length) {
            this.currentBackgroundIndex = 0;
        }
        const sprite = this.backgroundSprites[this.currentBackgroundIndex].src;
        this.currentBackgroundIndex++;
        return sprite;
    }

    getNextMonsterBlastSprite() {
        if (this.monsterBlastSprites.length === 0) return this.imagePaths.energyBlast;
        if (this.currentMonsterBlastIndex >= this.monsterBlastSprites.length) {
            this.currentMonsterBlastIndex = 0;
        }
        const sprite = this.monsterBlastSprites[this.currentMonsterBlastIndex].src;
        this.currentMonsterBlastIndex++;
        return sprite;
    }


     startBattle() {
        console.log('Starting battle with grade:', this.grade);
        this.battleActive = true;
        this.questionCount = 0;
        this.player = new Player('Math Ninja', 1);
        this.monster = new Monster('WOLF', 1);

        this.ui.showRestartButton();
        this.ui.showBattleScene();

        this.background = new Background(this.canvas, this.getNextBackgroundSprite());
        this.playerSprite = new Sprite(this.canvas, 50, 100, 100, 100, this.imagePaths.ninjaCat);
        this.monsterSprite = new Sprite(this.canvas, 450, 100, 100, 100, this.getNextMonsterSprite());

        // Assign a single monster blast sprite at start of battle
        this.monsterBlastSprite = this.getNextMonsterBlastSprite();

        this.ui.updateStartButton('Restart Battle');
        this.ui.updateHealthDisplays(this.player, this.monster);
        this.drawSprites();
        this.generateQuestion();
    }

    async handleAnswer(answer) {
        if (!this.battleActive) return;
        if (!this.currentQuestion) {
            console.error('No current question available');
            return;
        }

        const buttons = document.querySelectorAll('.answer-button');
        buttons.forEach(btn => btn.disabled = true);

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
            buttons.forEach(btn => btn.disabled = false);
            this.generateQuestion();
        }, 1500);
    }

    generateQuestion() {
        if (!this.battleActive) return;

        this.questionCount++;
        console.log('Generating question for grade:', this.grade);

        const newQuestion = QuestionFactory.generate(this.grade);
        if (!newQuestion) {
            console.error('Failed to generate question');
            return;
        }

        this.currentQuestion = newQuestion;
        this.ui.displayQuestion(this.currentQuestion, (answer) => this.handleAnswer(answer));
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
                // Use the currently assigned monster blast sprite
                this.monsterBlastSprite
            );

            blast.fire(() => {
                this.playerSprite.takeDamage();
                resolve();
            });
        });
    }


    // Player attack remains unchanged, always uses initial blast
    async playerAttack() {
        return new Promise(resolve => {
            this.playerSprite.attack();

            const blast = new EnergyBlast(
                this.canvas,
                this.playerSprite.x + this.playerSprite.width,
                this.playerSprite.y + this.playerSprite.height / 2,
                this.monsterSprite.x,
                this.monsterSprite.y + this.monsterSprite.height / 2,
                this.imagePaths.energyBlast // Player always uses initial blast
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
        this.ui.showLevelUpNotification(this.player.level); // Show the notification
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
                    this.getNextMonsterSprite()
                );
                // Assign a new monster blast sprite for the new monster
                this.monsterBlastSprite = this.getNextMonsterBlastSprite();

                this.background = new Background(this.canvas, this.getNextBackgroundSprite());

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
        if (this.battleActive) {
            this.drawSprites();
        }
        requestAnimationFrame(() => this.animate());
    }

    restartGame() {
        console.log('Restarting game...');
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

// Keep the DOMContentLoaded logic and window.game assignment as before
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
