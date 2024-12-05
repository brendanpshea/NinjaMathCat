// questions.js
class Question {
    constructor(grade) {
        this.grade = grade;
        this.questionText = '';
        this.correctAnswer = null;
        this.wrongAnswers = [];
        this.feedback = '';
        this.difficulty = 1; // 1 to 3, used for damage calculation
    }

    getNumberRange() {
        if (this.grade <= 0.5) return { min: 1, max: 5 };
        if (this.grade <= 1.0) return { min: 1, max: 10 };
        if (this.grade <= 1.5) return { min: 1, max: 20 };
        return { min: 1, max: 100 };
    }

    getAllAnswers() {
        return Utils.shuffle([...this.wrongAnswers, this.correctAnswer]);
    }

    isCorrect(answer) {
        return answer === this.correctAnswer;
    }
}

// Question type definitions remain similar but with added difficulty property
class Addition extends Question {
    generate() {
        const range = this.getNumberRange();
        const num1 = Utils.random(range.min, range.max);
        const num2 = Utils.random(range.min, range.max);
        
        this.questionText = `What is ${num1} + ${num2}?`;
        this.correctAnswer = num1 + num2;
        this.difficulty = Math.ceil((num1 + num2) / (range.max * 0.6));
        this.generateWrongAnswers();
        this.feedback = this.grade <= 0.5 ? 
            "Count using your fingers!" : 
            "Start with the bigger number and count up.";
        
        return this;
    }

    generateWrongAnswers() {
        const answers = new Set();
        while (answers.size < 3) {
            const wrong = this.correctAnswer + (Utils.random(0, 1) ? 1 : -1) * 
                Utils.random(1, Math.max(2, Math.floor(this.grade * 3)));
            if (wrong > 0 && wrong !== this.correctAnswer) answers.add(wrong);
        }
        this.wrongAnswers = Array.from(answers);
    }
}

// Add other question classes here...

class QuestionFactory {
    static getQuestionTypes(grade) {
        // Return available question types based on grade
        const types = [Addition];
        // Add other types as we implement them
        return types;
    }

    static generate(grade) {
        const types = this.getQuestionTypes(grade);
        const QuestionType = types[Utils.random(0, types.length - 1)];
        return new QuestionType(grade).generate();
    }
}

// Test function
function testQuestions() {
    const grades = [0, 0.5, 1, 1.5, 2];
    grades.forEach(grade => {
        debug(`\nTesting Grade ${grade}:`);
        const question = QuestionFactory.generate(grade);
        debug('Question:', question.questionText);
        debug('Correct Answer:', question.correctAnswer);
        debug('All Answers:', question.getAllAnswers());
        debug('Difficulty:', question.difficulty);
        debug('Feedback:', question.feedback);
    });
}

// Run tests if in debug mode
if (DEBUG) testQuestions();