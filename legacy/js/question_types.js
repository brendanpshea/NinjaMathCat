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

class SkipCounting extends NumericalQuestion {
    getSkipPatterns() {
        if (this.grade <= 0.5) {
            return [2];  // Early K: Just counting by 2s forward from small numbers
        } else if (this.grade <= 1.0) {
            return [2, 5, 10];  // Late K to 1st: Forward by 2s, 5s, 10s
        } else if (this.grade <= 1.5) {
            return [2, 3, 4, 5, 10];  // Mid 1st: Add counting by 3s and 4s
        } else if (this.grade <= 2.0) {
            return [2, 3, 4, 5, 10, 100];  // 2nd: Add counting by 100s
        } else if (this.grade <= 2.5) {
            return [2, 3, 4, 5, 10, 25, 50, 100];  // Mid 2nd: Add 25s and 50s
        } else {
            return [2, 3, 4, 5, 10, 25, 50, 100, -2, -5, -10];  // 3rd: Add negative numbers
        }
    }

    getStartRange() {
        if (this.grade <= 0.5) {
            return { min: 0, max: 10 };  // Early K: Small numbers
        } else if (this.grade <= 1.0) {
            return { min: 0, max: 20 };  // Late K to 1st: Up to 20
        } else if (this.grade <= 1.5) {
            return { min: 0, max: 50 };  // Mid 1st: Up to 50
        } else if (this.grade <= 2.0) {
            return { min: 0, max: 100 };  // 2nd: Up to 100
        } else if (this.grade <= 2.5) {
            return { min: 0, max: 200 };  // Mid 2nd: Up to 200
        } else {
            return { min: -50, max: 500 };  // 3rd: Include negatives and larger numbers
        }
    }

    generate() {
        const patterns = this.getSkipPatterns();
        const skipBy = patterns[QuestUtils.random(0, patterns.length - 1)];
        const range = this.getStartRange();
        
        // Calculate valid starting points based on the skip pattern
        let startNum;
        if (skipBy < 0) {
            // For negative counting, start with a multiple of the absolute value
            const maxSteps = Math.floor(Math.abs(skipBy * 8) / Math.abs(skipBy));
            const stepCount = QuestUtils.random(4, maxSteps);
            startNum = Math.abs(skipBy) * stepCount;
        } else {
            // Find how many complete steps we can take within the range
            const maxSteps = Math.floor((range.max - skipBy * 3) / skipBy);
            if (maxSteps < 1) {
                // Adjust range if needed
                startNum = 0;
            } else {
                // Choose a random multiple of skipBy within valid range
                const steps = QuestUtils.random(0, maxSteps);
                startNum = skipBy * steps;
            }
        }

        // Ensure start number is within range
        startNum = Math.max(range.min, Math.min(range.max - (skipBy * 3), startNum));

        // Generate the sequence
        const sequence = [
            startNum,
            startNum + skipBy,
            startNum + (skipBy * 2)
        ];

        // Format numbers for display
        const formattedSequence = sequence.map(num => num.toString()).join(", ");
        
        this.questionText = `What comes next: ${formattedSequence}, ___?`;
        this.correctAnswer = startNum + (skipBy * 3);

        // Generate wrong answers based on common mistakes
        this.wrongAnswers = [
            startNum + (skipBy * 3) + skipBy,  // Added too much
            startNum + (skipBy * 2),  // Repeated last number
            startNum + (Math.round(skipBy * 3.5))  // Used wrong multiple
        ];

        // Grade-appropriate feedback
        if (this.grade <= 1.0) {
            this.feedback = `Count by ${Math.abs(skipBy)}s to find what comes next.`;
        } else if (skipBy < 0) {
            this.feedback = `Count backwards by ${Math.abs(skipBy)}s to find the pattern.`;
        } else if (skipBy >= 100) {
            this.feedback = `Count by hundreds to find the pattern.`;
        } else if (skipBy >= 10) {
            this.feedback = `Count by tens to find the pattern.`;
        } else {
            this.feedback = `Look for the pattern: each number goes up by ${skipBy}.`;
        }

        return this;
    }

    generateWrongAnswers(options = {}) {
        if (this.wrongAnswers && this.wrongAnswers.length) {
            return this.wrongAnswers;
        }

        const skipBy = parseInt(this.questionText.split(", ")[1]) - 
                      parseInt(this.questionText.split(", ")[0]);

        return [
            this.correctAnswer + skipBy,  // Added too much
            this.correctAnswer - skipBy,  // Repeated last number
            this.correctAnswer + Math.round(skipBy * 0.5)  // Used wrong multiple
        ];
    }
}

// Your ComparisonQuestion class
        class ComparisonQuestion extends NumericalQuestion {
            constructor(grade) {
                super(grade);
                this.grade = grade;
            }

            generate() {
                const range = this.getNumberRange();
                
                // For grade > 1.0, ensure we compare with result of expression
                if (this.grade > 1.0) {
                    const num1 = QuestUtils.random(range.min, range.max);
                    const num2 = QuestUtils.random(1, 5); // Smaller range for second number
                    
                    // Create expression and comparison
                    const expression = `(${num1} + ${num2})`;
                    const expressionValue = num1 + num2;
                    
                    // Randomly choose comparison type
                    const comparisonType = QuestUtils.random(0, 2); // 0 = less than, 1 = equal, 2 = greater than
                    let comparisonValue;
                    let operator;
                    
                    if (comparisonType === 0) {
                        // Expression < comparisonValue
                        comparisonValue = expressionValue + QuestUtils.random(1, 5);
                        operator = '<';
                    } else if (comparisonType === 1) {
                        // Expression = comparisonValue
                        comparisonValue = expressionValue;
                        operator = '=';
                    } else {
                        // Expression > comparisonValue
                        comparisonValue = Math.max(range.min, expressionValue - QuestUtils.random(1, 5));
                        operator = '>';
                    }
                    
                    this.questionText = `Which is correct?`;
                    this.correctAnswer = `${expression} ${operator} ${comparisonValue}`;
                    
                    // Generate wrong answers - 2 with wrong operators, 1 with different strategy
                    const wrongOperators = ['<', '=', '>'].filter(op => op !== operator);
                    this.wrongAnswers = [
                        `${expression} ${wrongOperators[0]} ${comparisonValue}`, // Wrong operator 1
                        `${expression} ${wrongOperators[1]} ${comparisonValue}`, // Wrong operator 2
                    ];
                    
                    // For the third wrong answer, use different strategy based on operator
                    if (operator === '=') {
                        // For equals, create a comparison with a different number
                        const wrongValue = comparisonValue + QuestUtils.random(1, 3);
                        this.wrongAnswers.push(`${expression} = ${wrongValue}`);
                    } else {
                        // For < and >, flipped operands will be wrong
                        this.wrongAnswers.push(`${comparisonValue} ${operator} ${expression}`);
                    }
                } else {
                    // Simple number comparison for early grades
                    let num1 = QuestUtils.random(range.min, range.max);
                    let num2 = QuestUtils.random(range.min, range.max);
                    
                    // Ensure numbers are different to avoid multiple correct answers
                    while (num1 === num2) {
                        num2 = QuestUtils.random(range.min, range.max);
                    }
                    
                    this.questionText = `Which is correct?`;
                    
                    // Determine the correct relationship
                    let operator;
                    if (num1 > num2) {
                        operator = '>';
                    } else {
                        operator = '<';
                    }
                    
                    this.correctAnswer = `${num1} ${operator} ${num2}`;
                    
                    // Generate wrong answers: 2 with wrong operators, 1 with flipped operands
                    const wrongOperators = ['<', '=', '>'].filter(op => op !== operator);
                    this.wrongAnswers = [
                        `${num1} ${wrongOperators[0]} ${num2}`, // Wrong operator 1
                        `${num1} ${wrongOperators[1]} ${num2}`, // Wrong operator 2  
                        `${num2} ${operator} ${num1}` // Flipped operands (this will be wrong)
                    ];
                }

                this.feedback = `Compare the values carefully to find whether one is bigger, smaller, or equal.`;
                return this;
            }
            
            // Helper method to flip operators for creating wrong answers
            flipOperator(operator) {
                switch(operator) {
                    case '<': return '>';
                    case '>': return '<';
                    case '=': return '=';
                    default: return operator;
                }
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


// export all questions types
export {
    Addition,
    Subtraction,
    CountingObjects,
    NumberSequence,
    SkipCounting,
    ComparisonQuestion,
    PatternRecognition
};

