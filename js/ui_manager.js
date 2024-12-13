// ui_manager.js

export const IMAGE_PATHS = {
    background: 'assets/sprites/backgrounds/forest.png',
    ninjaCat: 'assets/sprites/characters/ninja-cat.png',
    energyBlast: 'assets/sprites/effects/energy-blast.png'
};

export const SELECTORS = {
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

export class UIManager {
    constructor(game) {
        this.game = game;
        this.BASE_WIDTH = 600;
        this.BASE_HEIGHT = 300;
        this.canvas = this.getEl('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scale = 1;

        this.calculateScale();
        this.initializeCanvas();
        this.setupEventListeners();
    }

    getEl(selectorKey) {
        return document.getElementById(SELECTORS[selectorKey]);
    }

    showElement(selectorKey) {
        const el = this.getEl(selectorKey);
        if (el) el.style.display = 'block';
    }

    hideElement(selectorKey) {
        const el = this.getEl(selectorKey);
        if (el) el.style.display = 'none';
    }

    setupEventListeners() {
        const startBattleBtn = this.getEl('startBattleButton');
        const gradeSelect = this.getEl('gradeSelect');
        const restartGameBtn = this.getEl('restartGameButton');

        if (startBattleBtn) {
            startBattleBtn.addEventListener('click', () => {
                const selectedGrade = parseFloat(gradeSelect.value);
                this.game.grade = selectedGrade;
                console.log('Starting battle with grade:', selectedGrade);
                this.game.startBattle();
            });
        }

        if (gradeSelect) {
            gradeSelect.addEventListener('change', (e) => {
                const selectedGrade = parseFloat(e.target.value);
                console.log('Grade changed to:', selectedGrade);
                this.game.grade = selectedGrade;
            });
        }

        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', () => {
                console.log('Restart button clicked');
                this.game.restartGame();
            });
        }

        window.addEventListener('resize', () => this.handleResize());
    }

    calculateScale() {
        const container = this.getEl('gameContainer');
        const containerWidth = container.clientWidth;
        this.scale = Math.min(1, (containerWidth - 40) / this.BASE_WIDTH);
    }

    initializeCanvas() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.canvas.width = Math.floor(this.BASE_WIDTH * this.scale);
        this.canvas.height = Math.floor(this.BASE_HEIGHT * this.scale);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    resizeCanvas() {
        this.calculateScale();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.canvas.width = Math.floor(this.BASE_WIDTH * this.scale);
        this.canvas.height = Math.floor(this.BASE_HEIGHT * this.scale);
        this.ctx.scale(this.scale, this.scale);

        if (this.game.battleActive) {
            this.game.drawSprites();
        }
    }

    handleResize() {
        this.resizeCanvas();
    }

    updateHealthDisplays(player, monster) {
        const playerHealth = this.getEl('playerHealth');
        const monsterHealth = this.getEl('monsterHealth');

        playerHealth.style.width = `${player.getHealthPercentage()}%`;
        monsterHealth.style.width = `${monster.getHealthPercentage()}%`;

        playerHealth.setAttribute('data-health', `${Math.ceil(player.currentHealth)}/${player.maxHealth}`);
        monsterHealth.setAttribute('data-health', `${Math.ceil(monster.currentHealth)}/${monster.maxHealth}`);
    }

    updatePlayerLevel(level) {
        const levelDiv = this.getEl('playerLevel');
        levelDiv.textContent = `Level: ${level}`;
        levelDiv.classList.add('level-up');
        setTimeout(() => levelDiv.classList.remove('level-up'), 3000);
    }

    showLevelUpNotification(level) {
        const notificationEl = document.getElementById('level-up-notification');
        if (!notificationEl) return;

        notificationEl.textContent = `LEVEL UP! Now Level ${level}`;
        notificationEl.style.display = 'block';
        notificationEl.classList.add('show');

        // Hide the notification after 4 seconds
        setTimeout(() => {
            notificationEl.classList.remove('show');
            notificationEl.style.display = 'none';
        }, 4000);
    }


    updateDefeatedCounter(count) {
        const counterElement = this.getEl('monstersDefeated');
        if (counterElement) {
            counterElement.textContent = `Monsters Defeated: ${count}`;
        }
    }

    showRestartButton() {
        const container = this.getEl('restartButtonContainer');
        if (container) container.classList.add('visible');
    }

    hideRestartButton() {
        const container = this.getEl('restartButtonContainer');
        if (container) container.classList.remove('visible');
    }

    displayQuestion(question, onAnswerCallback) {
        console.log('Displaying question:', question);
        const questionText = this.getEl('questionText');
        const answersDiv = this.getEl('answers');
        const questionArea = this.getEl('questionArea');

        if (!question || !questionText || !answersDiv || !questionArea) {
            console.error('Missing question or UI elements');
            return;
        }

        questionArea.style.display = 'block';
        
        try {
            questionText.textContent = question.questionText;
            answersDiv.innerHTML = '';

            const answers = question.getAllAnswers();
            console.log('Question answers:', answers);

            answers.forEach(answer => {
                const button = document.createElement('button');
                button.className = 'answer-button';
                button.textContent = answer;
                button.addEventListener('click', () => onAnswerCallback(answer));
                answersDiv.appendChild(button);
            });
        } catch (error) {
            console.error('Error displaying question:', error);
        }
    }

    showFeedback(message, isCorrect) {
        const feedbackText = this.getEl('feedbackText');
        feedbackText.textContent = message;
        feedbackText.classList.remove(isCorrect ? 'incorrect-feedback' : 'correct-feedback');
        feedbackText.classList.add(isCorrect ? 'correct-feedback' : 'incorrect-feedback');
    }

    clearFeedback() {
        const feedbackText = this.getEl('feedbackText');
        feedbackText.textContent = '';
    }

    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.ctx;
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    clearAnswers() {
        const answersDiv = this.getEl('answers');
        answersDiv.innerHTML = '';
    }

    updateStartButton(text) {
        const startBattleBtn = this.getEl('startBattleButton');
        if (startBattleBtn) startBattleBtn.textContent = text;
    }

    showBattleScene() {
        this.showElement('battleScene');
        this.showElement('questionArea');
        this.hideElement('welcomeHeader');
        this.hideElement('startSection');
        this.hideElement('ninjaCatImage');
    }

    showWelcomeScreen() {
        this.hideElement('battleScene');
        this.hideElement('questionArea');
        this.showElement('welcomeHeader');
        this.showElement('startSection');
        this.showElement('ninjaCatImage');
    }

    resetGameUI() {
        console.log('Resetting UI...');

        const questionText = this.getEl('questionText');
        const answersDiv = this.getEl('answers');

        questionText.textContent = '';
        answersDiv.innerHTML = '';
        this.updateStartButton('Start Adventure!');

        this.showWelcomeScreen();
        this.clearFeedback();
    }

    showTreasure(treasure) {
        // Create a treasure display element
        const treasureDiv = document.createElement('div');
        treasureDiv.classList.add('treasure');
        treasureDiv.innerHTML = `
            <span class="treasure-emoji">${treasure.emoji}</span>
            <div class="treasure-info">
                <h3>You found a ${treasure.name}!</h3>
                <p>${treasure.description}</p>
            </div>
        `;

        // Style the treasure display (you can adjust styles as needed)
        treasureDiv.style.position = 'fixed';
        treasureDiv.style.bottom = '20px';
        treasureDiv.style.right = '20px';
        treasureDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        treasureDiv.style.color = '#fff';
        treasureDiv.style.padding = '10px';
        treasureDiv.style.borderRadius = '8px';
        treasureDiv.style.display = 'flex';
        treasureDiv.style.alignItems = 'center';
        treasureDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        treasureDiv.style.zIndex = '1000';
        treasureDiv.style.animation = 'fadeIn 0.5s';

        // Append to the body or a specific container
        document.body.appendChild(treasureDiv);

        // Automatically remove the treasure display after a few seconds
        setTimeout(() => {
            treasureDiv.style.transition = 'opacity 0.5s';
            treasureDiv.style.opacity = '0';
            setTimeout(() => {
                treasureDiv.remove();
            }, 500);
        }, 10000);
    }
    
}   

