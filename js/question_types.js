// question_types.js
// Description: Contains classes for generating different types of questions.

import {QuestUtils, Question, NumericalQuestion, generateWrongAnswersForNumerical } from './base_question.js';

// Addition Question
class Addition extends NumericalQuestion {
    generate() {
        const range = this.getNumberRange();
        const num1 = QuestUtils.random(range.min, range.max);
        const num2 = QuestUtils.random(range.min, range.max);

        this.questionText = `What is ${num1} + ${num2}?`;
        this.correctAnswer = num1 + num2;
        this.difficulty = Math.ceil((num1 + num2) / (range.max * 0.6));
        this.wrongAnswers = this.generateWrongAnswers();
        this.feedback = this.grade <= 0.5 ?
            "Count using your fingers!" :
            "Start with the bigger number and count up.";

        return this;
    }
}

// Subtraction Question
class Subtraction extends NumericalQuestion {
    generate() {
        const range = this.getNumberRange();
        let num1 = QuestUtils.random(range.min, range.max);
        let num2 = QuestUtils.random(range.min, range.max);

        if (num1 < num2) [num1, num2] = [num2, num1];

        this.questionText = `What is ${num1} - ${num2}?`;
        this.correctAnswer = num1 - num2;
        this.difficulty = Math.ceil(num1 / (range.max * 0.6));
        this.wrongAnswers = this.generateWrongAnswers({
            requirePositive: true,
            minWrong: 3
        });
        this.feedback = "Count backwards from the larger number.";

        return this;
    }
}

// CountingObjects Question
class CountingObjects extends NumericalQuestion {
    generate() {
        const range = this.getNumberRange();
        const count = QuestUtils.random(range.min, range.max);
        const objects = this.grade <= 0.5 ? '🔵' : ['🔵', '🌟', '❤️', '🎈'][QuestUtils.random(0, 3)];

        this.questionText = `Count the objects: ${objects.repeat(count)}`;
        this.correctAnswer = count;
        this.difficulty = Math.ceil(count / (range.max * 0.6));
        this.wrongAnswers = this.generateWrongAnswers({
            requirePositive: true,
            minWrong: 3
        });
        this.feedback = count > 10 ? "Try counting by groups of 2 or 5!" : "Touch each object as you count!";

        return this;
    }
}

// NumberSequence Question
class NumberSequence extends NumericalQuestion {
    generate() {
        const range = this.getNumberRange();
        const num = QuestUtils.random(range.min, range.max - 1);
        const isBefore = QuestUtils.random(0, 1) === 1;

        this.questionText = isBefore ?
            `What number comes before ${num}?` :
            `What number comes after ${num}?`;
        this.correctAnswer = isBefore ? num - 1 : num + 1;
        this.difficulty = 1;
        this.wrongAnswers = this.generateWrongAnswers();
        this.feedback = isBefore ?
            "Count backwards one number." :
            "Count forward one number.";

        return this;
    }
}

// SkipCounting Question
class SkipCounting extends NumericalQuestion {
    generate() {
        const skipBy = this.grade <= 1.0 ? 2 : [2, 5, 10][QuestUtils.random(0, 2)];
        const startNum = QuestUtils.random(0, 5) * skipBy;

        this.questionText = `What comes next: ${startNum}, ${startNum + skipBy}, ${startNum + (skipBy * 2)}, ___?`;
        this.correctAnswer = startNum + (skipBy * 3);
        this.difficulty = Math.ceil(skipBy / 4);
        this.wrongAnswers = this.generateWrongAnswers();
        this.feedback = `Count by ${skipBy}s to find the pattern.`;

        return this;
    }
}


// ShapeIdentification Question (Non-Numerical)
class ShapeIdentification extends Question {
    generate() {
        const shapes = ['circle', 'square', 'triangle', 'rectangle'];
        const correctShape = shapes[QuestUtils.random(0, shapes.length - 1)];

        this.questionText = `Which of these is a ${correctShape}?`;
        this.correctAnswer = correctShape;
        this.wrongAnswers = shapes.filter(shape => shape !== correctShape);
        this.feedback = "Look at the shape carefully and compare its sides and corners.";

        return this;
    }
}

// ComparisonQuestion (Numerical)
class ComparisonQuestion extends NumericalQuestion {
    generate() {
        const range = this.getNumberRange();
        const num1 = QuestUtils.random(range.min, range.max);
        const num2 = QuestUtils.random(range.min, range.max);

        // Generate question text
        this.questionText = `Which is correct? ${num1} __ ${num2}`;

        // Map answers to integers
        const possibleAnswers = [
            `${num1} < ${num2}`, // Index 0
            `${num1} > ${num2}`, // Index 1
            `${num1} = ${num2}`, // Index 2
            "?"                  // Index 3
        ];

        // Determine the correct answer index
        let correctIndex;
        if (num1 < num2) {
            correctIndex = 0;
        } else if (num1 > num2) {
            correctIndex = 1;
        } else {
            correctIndex = 2;
        }

        this.correctAnswer = possibleAnswers[correctIndex];

        // Generate wrong answers
        this.wrongAnswers = this.generateWrongAnswers({
            requirePositive: false,
            minWrong: 3
        });

        this.feedback = `Compare the two numbers carefully to find whether one is bigger, smaller, or equal.`;

        return this;
    }

    // Override to handle comparison operators
    generateWrongAnswers(options = {}) {
        const possibleAnswers = [
            `${this.correctAnswer.split(' ')[0]} < ${this.correctAnswer.split(' ')[2]}`, // Original correct
            `${this.correctAnswer.split(' ')[0]} > ${this.correctAnswer.split(' ')[2]}`,
            `${this.correctAnswer.split(' ')[0]} = ${this.correctAnswer.split(' ')[2]}`,
            "?"
        ];

        // Remove the correct answer
        const wrongOptions = possibleAnswers.filter(ans => ans !== this.correctAnswer);

        // Shuffle and select 3 wrong answers
        return QuestUtils.shuffle(wrongOptions).slice(0, 3);
    }
}

class PatternRecognition extends Question {
    constructor(grade) {
        super(grade);
        // Available pattern categories with their emojis
        this.patternsPool = [
            ['🔵', '🔴', '🟢', '🟡', '🟣'], // Colors
            ['🐶', '🐱', '🐭', '🐹', '🐰', '🐼', '🐨', '🦁'], // Animals
            ['☀️', '🌧️', '❄️', '🌈', '🌪️', '🌤️', '🌩️'], // Weather
            ['⭐', '🌙', '🌟', '☄️', '💫', '✨', '🌕'], // Celestial
            ['🟨', '🟥', '🟧', '🟩', '🟦', '⬛', '⬜'], // Geometric shapes
            ['🍎', '🍊', '🍋', '🍉', '🍇', '🍓', '🍒'], // Fruits
            ['🎵', '🎶', '🎷', '🎸', '🥁', '🎺', '🎻'], // Music
            ['🚗', '🚙', '🛵', '🚲', '✈️', '🚀', '🛶'], // Vehicles
            ['🌳', '🌲', '🌴', '🌵', '🌾', '🌿', '🍂'], // Nature
            ['🍕', '🍔', '🌭', '🌮', '🍩', '🍪', '🍰'], // Foods
            ['👗', '👒', '🧥', '👞', '👜', '🕶️', '🎩'], // Fashion
            ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓'], // Sports
            ['📚', '📖', '📕', '📗', '📘', '📙', '📝'], // School
            ['⛵', '🚤', '🛳️', '⛴️', '🚢', '⚓', '🪝'], // Ships
            ['🐝', '🐞', '🦋', '🐌', '🐜', '🐛', '🦂'], // Insects
            ['🦄', '🐉', '🐲', '🐦‍⬛', '🦜', '🦩', '🐺'], // Fantasy & Birds
            ['🍄', '🌸', '🌺', '🌼', '🌻', '🌷', '🌹'], // Flowers
            ['🎂', '🎉', '🎁', '🎈', '🎊', '🎀', '🪅'], // Celebrations
            ['🔑', '🛡️', '⚔️', '🗡️', '🏹', '🧭', '🗺️'], // Adventure
        ];
        this.fullPattern = []; // Store the complete pattern for reference
        this.selectedCategory = []; // Store the current category of emojis
    }

    generate() {
        const patternLength = this.grade <= 0.5 ? 2 : Utils.random(3, 5); // Shorter patterns for younger grades
        const repetitions = this.grade <= 0.5 ? 3 : 4; // Adjust repetition based on grade

        // Randomly select a pattern category from the pool
        this.selectedCategory = this.patternsPool[Utils.random(0, this.patternsPool.length - 1)];

        // Generate the base pattern using symbols from the selected category
        const pattern = Array.from({ length: patternLength }, () => 
            this.selectedCategory[Utils.random(0, this.selectedCategory.length - 1)]
        );

        // Create the full pattern by repeating the base pattern
        this.fullPattern = Array(repetitions).fill(pattern).flat();

        // Insert a blank in the repeated pattern
        const missingIndex = Utils.random(0, this.fullPattern.length - 1);
        this.correctAnswer = this.fullPattern[missingIndex];
        this.fullPattern[missingIndex] = '___';

        this.questionText = `Complete the repeating pattern: ${this.fullPattern.join(' ')}`;
        this.wrongAnswers = this.generateWrongAnswers();
        this.feedback = "Look for the repeated sequence to identify the missing element.";
        this.difficulty = Math.ceil(patternLength / 3); // Adjust difficulty based on pattern length

        return this;
    }

    /**
     * Generates wrong answers by prioritizing symbols used in the current pattern,
     * then falling back to other symbols from the same category if needed.
     * @returns {Array} An array of three wrong answer emojis.
     */
    generateWrongAnswers() {
        // Get unique symbols already used in the pattern (excluding blank and correct answer)
        const uniqueSymbols = [...new Set(this.fullPattern)].filter(symbol => 
            symbol !== '___' && symbol !== this.correctAnswer
        );

        // If we need more wrong answers, add symbols from the same category
        if (uniqueSymbols.length < 3) {
            // Get additional symbols from the same category that aren't the correct answer
            // and haven't been used in the pattern
            const additionalSymbols = this.selectedCategory.filter(symbol => 
                symbol !== this.correctAnswer && !uniqueSymbols.includes(symbol)
            );
            uniqueSymbols.push(...additionalSymbols);
        }

        // Shuffle all available wrong answers and take the first three
        return Utils.shuffle(uniqueSymbols).slice(0, 3);
    }

    /**
     * Override to provide pattern-specific feedback
     * @param {String} answer - The student's answer
     * @returns {String} - Detailed feedback based on the answer
     */
    getFeedback(answer) {
        if (this.isCorrect(answer)) {
            return "Great job! You found the pattern! 🌟";
        }
        
        // Generate more specific feedback based on the pattern structure
        const basePattern = this.getBasePattern();
        return `Look carefully at how the pattern repeats: ${basePattern.join(' ')}. Try again!`;
    }

    /**
     * Helper method to get the base pattern before repetition
     * @returns {Array} The base pattern that was repeated
     */
    getBasePattern() {
        const patternLength = this.grade <= 0.5 ? 2 : Utils.random(3, 5);
        return this.fullPattern.slice(0, patternLength);
    }
}

// MoneyCounting Question
class MoneyCounting extends NumericalQuestion {
    generate() {
        // Define coins and their corresponding visuals
        const coins = [
            { value: 1, visual: '🪙1¢' },   // Penny
            { value: 5, visual: '🪙5¢' },   // Nickel
            { value: 10, visual: '🪙10¢' }, // Dime
            { value: 25, visual: '🪙25¢' }, // Quarter
            { value: 50, visual: '🪙50¢' }, // Half Dollar (optional for higher grades)
            { value: 100, visual: '💵$1' }  // Dollar Bill
        ];

        // Adjust difficulty based on grade level
        const count = this.grade <= 1.0 ? 2 : Utils.random(3, 5); // Fewer coins for younger students
        const selectedCoins = Array.from({ length: count }, () => coins[Utils.random(0, coins.length - 1)]);

        // Calculate the total value
        const totalCents = selectedCoins.reduce((sum, coin) => sum + coin.value, 0);
        const totalDollars = totalCents / 100;

        // Generate the visuals for the question
        const visuals = selectedCoins.map(coin => coin.visual).join(' + ');

        this.questionText = `How much money is this? ${visuals}`;
        this.correctAnswer = `$${totalDollars.toFixed(2)}`; // Convert cents to dollars and format as currency
        this.wrongAnswers = this.generateWrongAnswers(totalDollars); // Pass numerical value
        this.feedback = "Carefully add the values of the coins and dollars.";

        return this;
    }

    /**
     * Generates wrong answers formatted as currency strings.
     * @param {number} correctAmount - The correct monetary amount in dollars.
     * @returns {Array} - An array of wrong answer strings formatted as currency.
     */
    generateWrongAnswers(correctAmount) {
        const numericalWrongAnswers = generateWrongAnswersForNumerical(correctAmount, this.grade, {
            require_positive: true,
            min_wrong: 3
        });

        // Format wrong answers as currency
        return numericalWrongAnswers.map(amount => `$${amount.toFixed(2)}`);
    }
}



// export all questions types
export {
    Addition,
    Subtraction,
    CountingObjects,
    NumberSequence,
    SkipCounting,
    ShapeIdentification,
    ComparisonQuestion,
    PatternRecognition,
    MoneyCounting
};

