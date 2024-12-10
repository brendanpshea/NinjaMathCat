// base_question.js
// Description: Base classes for generating questions and answers.

const QuestUtils = {
    random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    shuffle: (array) => array.sort(() => Math.random() - 0.5)
};

function generateWrongAnswersForNumerical(correctAnswer, grade, options = {}) {
    const {
        requirePositive = true,
        minWrong = 3,
        maxAttempts = 50
    } = options;

    const answers = new Set();
    let attempts = 0;

    while (answers.size < minWrong && attempts < maxAttempts) {
        attempts++;
        const variation = Math.max(2, Math.floor(grade * 3));
        let wrong = correctAnswer + (QuestUtils.random(0, 1) ? 1 : -1) * QuestUtils.random(1, variation);

        if (correctAnswer <= 3) {
            const alternatives = [
                correctAnswer + 1,
                correctAnswer + 2,
                correctAnswer * 2,
                requirePositive ? Math.max(1, correctAnswer - 1) : correctAnswer - 1
            ];
            wrong = alternatives[QuestUtils.random(0, alternatives.length - 1)];
        }

        if ((!requirePositive || wrong > 0) && wrong !== correctAnswer) {
            answers.add(wrong);
        }
    }

    const backupAnswers = [
        correctAnswer + 1,
        correctAnswer + 2,
        correctAnswer + 3,
        correctAnswer * 2,
        Math.max(1, correctAnswer - 1)
    ].filter(num => (!requirePositive || num > 0) && num !== correctAnswer && !answers.has(num));

    for (const answer of backupAnswers) {
        if (answers.size >= minWrong) break;
        answers.add(answer);
    }

    return Array.from(answers).slice(0, minWrong);
}

class Question {
    constructor(grade) {
        this.grade = grade;
        this.questionText = '';
        this.correctAnswer = null;
        this.wrongAnswers = [];
        this.feedback = '';
        this.difficulty = 1;
    }

    getNumberRange() {
        if (this.grade <= 0.5) return { min: 1, max: 5 };
        if (this.grade <= 1.0) return { min: 1, max: 10 };
        if (this.grade <= 1.5) return { min: 1, max: 20 };
        return { min: 1, max: 100 };
    }

    getAllAnswers() {
        return QuestUtils.shuffle([...this.wrongAnswers, this.correctAnswer]);
    }

    isCorrect(answer) {
        return answer === this.correctAnswer;
    }

    getCorrectAnswer() {
        return this.correctAnswer;
    }

    generate() {
        throw new Error('Generate method should be implemented by subclasses.');
    }
}

class NumericalQuestion extends Question {
    constructor(grade) {
        super(grade);
    }

    generateWrongAnswers(options = {}) {
        return generateWrongAnswersForNumerical(this.correctAnswer, this.grade, options);
    }
}

export {QuestUtils, Question, NumericalQuestion, generateWrongAnswersForNumerical };
