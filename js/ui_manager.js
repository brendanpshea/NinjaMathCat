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
        this.canvas = document.getElementById(SELECTORS.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize canvas dimensions
        this.BASE_WIDTH = 600;
        this.BASE_HEIGHT = 300;
        this.canvas.width = this.BASE_WIDTH;
        this.canvas.height = this.BASE_HEIGHT;
        this.scale = 1;
        
        this.calculateScale();
        this.initializeCanvas();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const startBattleBtn = document.getElementById(SELECTORS.startBattleButton);
        const gradeSelect = document.getElementById(SELECTORS.gradeSelect);
        const restartGameBtn = document.getElementById(SELECTORS.restartGameButton);
    
        if (startBattleBtn) {
            startBattleBtn.addEventListener('click', () => {
                // Get the current grade selection before starting battle
                const selectedGrade = parseFloat(gradeSelect.value);
                this.game.grade = selectedGrade;
                console.log('Starting battle with grade:', selectedGrade); // Debug log
                this.game.startBattle();
            });
        }
    
        if (gradeSelect) {
            gradeSelect.addEventListener('change', (e) => {
                const selectedGrade = parseFloat(e.target.value);
                console.log('Grade changed to:', selectedGrade); // Debug log
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
        const container = document.getElementById(SELECTORS.gameContainer);
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
        const playerHealth = document.getElementById(SELECTORS.playerHealth);
        const monsterHealth = document.getElementById(SELECTORS.monsterHealth);

        playerHealth.style.width = `${player.getHealthPercentage()}%`;
        monsterHealth.style.width = `${monster.getHealthPercentage()}%`;

        playerHealth.setAttribute('data-health', 
            `${Math.ceil(player.currentHealth)}/${player.maxHealth}`);
        monsterHealth.setAttribute('data-health',
            `${Math.ceil(monster.currentHealth)}/${monster.maxHealth}`);
    }

    updatePlayerLevel(level) {
        const levelDiv = document.getElementById(SELECTORS.playerLevel);
        levelDiv.textContent = `Level: ${level}`;
        levelDiv.classList.add('level-up');
        setTimeout(() => levelDiv.classList.remove('level-up'), 1000);
    }

    updateDefeatedCounter(count) {
        const counterElement = document.getElementById(SELECTORS.monstersDefeated);
        if (counterElement) {
            counterElement.textContent = `Monsters Defeated: ${count}`;
        }
    }

    showRestartButton() {
        document.getElementById(SELECTORS.restartButtonContainer).classList.add('visible');
    }

    hideRestartButton() {
        document.getElementById(SELECTORS.restartButtonContainer).classList.remove('visible');
    }

    displayQuestion(question, onAnswerCallback) {
    console.log('Displaying question:', question); // Debug the question object
    const questionText = document.getElementById(SELECTORS.questionText);
    const answersDiv = document.getElementById(SELECTORS.answers);
    const questionArea = document.getElementById(SELECTORS.questionArea);

    if (!question) {
        console.error('Question is undefined in displayQuestion');
        return;
    }

    if (!questionText || !answersDiv || !questionArea) {
        console.error('Missing UI elements:', {
            questionText: !!questionText,
            answersDiv: !!answersDiv,
            questionArea: !!questionArea
        });
        return;
    }

    // Make sure question area is visible
    questionArea.style.display = 'block';
    
    try {
        questionText.textContent = question.questionText;
        answersDiv.innerHTML = '';

        const answers = question.getAllAnswers();
        console.log('Question answers:', answers); // Debug the answers

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
        const feedbackText = document.getElementById(SELECTORS.feedbackText);
        feedbackText.textContent = message;
        feedbackText.classList.remove(isCorrect ? 'incorrect-feedback' : 'correct-feedback');
        feedbackText.classList.add(isCorrect ? 'correct-feedback' : 'incorrect-feedback');
    }

    clearFeedback() {
        document.getElementById(SELECTORS.feedbackText).textContent = '';
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
        document.getElementById(SELECTORS.answers).innerHTML = '';
    }

    updateStartButton(text) {
        const startBattleBtn = document.getElementById(SELECTORS.startBattleButton);
        if (startBattleBtn) {
            startBattleBtn.textContent = text;
        }
    }

    showBattleScene() {
        document.getElementById(SELECTORS.battleScene).style.display = 'block';
        document.getElementById(SELECTORS.questionArea).style.display = 'block';
        document.getElementById(SELECTORS.welcomeHeader).style.display = 'none';
        document.getElementById(SELECTORS.startSection).style.display = 'none';
        document.getElementById(SELECTORS.ninjaCatImage).style.display = 'none';
    }

    showWelcomeScreen() {
        document.getElementById(SELECTORS.battleScene).style.display = 'none';
        document.getElementById(SELECTORS.questionArea).style.display = 'none';
        document.getElementById(SELECTORS.welcomeHeader).style.display = 'block';
        document.getElementById(SELECTORS.startSection).style.display = 'block';
        document.getElementById(SELECTORS.ninjaCatImage).style.display = 'block';
    }

    resetGameUI() {
        console.log('Resetting UI...');
        
        // Reset text elements
        document.getElementById(SELECTORS.questionText).textContent = '';
        document.getElementById(SELECTORS.answers).innerHTML = '';
        this.updateStartButton('Start Adventure!');
        
        // Show welcome screen and hide battle elements
        this.showWelcomeScreen();
        
        // Clear any feedback
        this.clearFeedback();
    }
}