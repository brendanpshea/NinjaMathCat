// questions.js

// Utility functions (Assuming Utils is predefined with random and shuffle methods)
const QuestUtils = {
    random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    shuffle: (array) => array.sort(() => Math.random() - 0.5)
};

// Shared utility function for generating wrong numerical answers
function generateWrongAnswersForNumerical(correctAnswer, grade, options = {}) {
    const {
        requirePositive = true,  // Whether answers must be > 0
        minWrong = 3,           // How many wrong answers we need
        maxAttempts = 50        // Prevent infinite loops
    } = options;

    const answers = new Set();
    let attempts = 0;

    // First pass: try to generate answers using standard method
    while (answers.size < minWrong && attempts < maxAttempts) {
        attempts++;

        // Use a wider variation range for more possibilities
        const variation = Math.max(2, Math.floor(grade * 3));
        let wrong = correctAnswer + (QuestUtils.random(0, 1) ? 1 : -1) *
            QuestUtils.random(1, variation);

        // Special handling for small numbers
        if (correctAnswer <= 3) {
            // Generate alternative wrong answers appropriate for small numbers
            const alternatives = [
                correctAnswer + 1,
                correctAnswer + 2,
                correctAnswer * 2,
                requirePositive ? Math.max(1, correctAnswer - 1) : correctAnswer - 1
            ];
            wrong = alternatives[QuestUtils.random(0, alternatives.length - 1)];
        }

        // Validate the wrong answer
        if ((!requirePositive || wrong > 0) && wrong !== correctAnswer) {
            answers.add(wrong);
        }
    }

    // Second pass: if we still need more answers, use guaranteed unique values
    const backupAnswers = [
        correctAnswer + 1,
        correctAnswer + 2,
        correctAnswer + 3,
        correctAnswer * 2,
        Math.max(1, correctAnswer - 1)
    ].filter(num =>
        (!requirePositive || num > 0) &&
        num !== correctAnswer &&
        !answers.has(num)
    );

    // Add backup answers until we have enough
    for (const answer of backupAnswers) {
        if (answers.size >= minWrong) break;
        answers.add(answer);
    }

    return Array.from(answers).slice(0, minWrong);
}

// Base Question class
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

// NumericalQuestion class that uses the shared wrong answer generator
class NumericalQuestion extends Question {
    constructor(grade) {
        super(grade);
    }

    generateWrongAnswers(options = {}) {
        return generateWrongAnswersForNumerical(this.correctAnswer, this.grade, options);
    }
}

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

// --- New Word Problem Classes ---

// WordProbAdd Question
class WordProbAdd extends NumericalQuestion {
    generate() {
        const range = this.getNumberRange();
        const num1 = Utils.random(range.min, range.max - 1);
        const num2 = Utils.random(range.min, range.max - num1); // Ensure non-negative answer

        // Problem templates for addition
        const templates = [
            {
                text: (n1, n2) => `You have ${n1} apples and find ${n2} more. How many apples do you have in total?`,
                operation: (n1, n2) => n1 + n2,
                feedback: "Add the quantities together to find the total."
            },
            {
                text: (n1, n2) => `There are ${n1} red balloons and ${n2} blue balloons. How many balloons are there altogether?`,
                operation: (n1, n2) => n1 + n2,
                feedback: "Combine the number of balloons to get the total."
            },
            {
                text: (n1, n2) => `Sarah has ${n1} stickers and buys ${n2} more. How many stickers does she have now?`,
                operation: (n1, n2) => n1 + n2,
                feedback: "Sum the stickers to find the new total."
            }
        ];

        // Select a random template and generate the problem
        const template = templates[Utils.random(0, templates.length - 1)];
        const text = template.text(num1, num2);
        const correctAnswer = template.operation(num1, num2);

        this.questionText = text;
        this.correctAnswer = correctAnswer;
        this.difficulty = Math.ceil(correctAnswer / (range.max * 0.6));
        this.wrongAnswers = this.generateWrongAnswers({
            requirePositive: true,
            minWrong: 3
        });
        this.feedback = template.feedback;

        return this;
    }
}

// WordProbSub Question
class WordProbSub extends NumericalQuestion {
    generate() {
        const range = this.getNumberRange();
        const num1 = Utils.random(range.min, range.max);
        const num2 = Utils.random(0, num1); // Ensure non-negative answer

        // Problem templates for subtraction
        const templates = [
            {
                text: (n1, n2) => `You have ${n1} candies and give away ${n2}. How many candies do you have left?`,
                operation: (n1, n2) => n1 - n2,
                feedback: "Subtract the given away candies from the total."
            },
            {
                text: (n1, n2) => `There are ${n1} books on a shelf. ${n2} books are removed. How many books remain?`,
                operation: (n1, n2) => n1 - n2,
                feedback: "Deduct the removed books to find the remaining number."
            },
            {
                text: (n1, n2) => `Emily has ${n1} balloons. ${n2} balloons burst. How many balloons does she still have?`,
                operation: (n1, n2) => n1 - n2,
                feedback: "Take away the burst balloons from the total."
            }
        ];

        // Select a random template and generate the problem
        const template = templates[Utils.random(0, templates.length - 1)];
        const text = template.text(num1, num2);
        const correctAnswer = template.operation(num1, num2);

        this.questionText = text;
        this.correctAnswer = correctAnswer;
        this.difficulty = Math.ceil(num1 / (range.max * 0.6));
        this.wrongAnswers = this.generateWrongAnswers({
            require_positive: true,
            minWrong: 3
        });
        this.feedback = template.feedback;

        return this;
    }
}

// WordProbDiv Question
class WordProbDiv extends NumericalQuestion {
    generate() {
        const range = this.getNumberRange();
        const divisor = Utils.random(1, Math.min(5, range.max)); // Avoid large divisors
        const quotient = Utils.random(1, Math.floor(range.max / divisor));
        const dividend = divisor * quotient;

        // Problem templates for division
        const templates = [
            {
                text: (d, q) => `There are ${d} cookies divided equally among ${q} friends. How many cookies does each friend get?`,
                operation: (d, q) => d / q,
                feedback: "Divide the total cookies by the number of friends."
            },
            {
                text: (d, q) => `A farmer has ${d} apples and wants to pack them into boxes with ${q} apples each. How many boxes can he fill?`,
                operation: (d, q) => d / q,
                feedback: "Divide the apples by the number per box to find the number of boxes."
            },
            {
                text: (d, q) => `There are ${d} stickers shared equally among ${q} students. How many stickers does each student receive?`,
                operation: (d, q) => d / q,
                feedback: "Split the stickers equally among the students by dividing."
            }
        ];

        // Select a random template and generate the problem
        const template = templates[Utils.random(0, templates.length - 1)];
        const text = template.text(dividend, divisor);
        const correctAnswer = template.operation(dividend, divisor);

        this.questionText = text;
        this.correctAnswer = correctAnswer;
        this.difficulty = Math.ceil(quotient / (range.max * 0.6));
        this.wrongAnswers = this.generateWrongAnswers({
            require_positive: true,
            min_wrong: 3
        });
        this.feedback = template.feedback;

        return this;
    }
}

// WordProbMult Question
class WordProbMult extends NumericalQuestion {
    generate() {
        const range = this.getNumberRange();
        const num1 = Utils.random(range.min, Math.floor(range.max / 2));
        const num2 = Utils.random(1, Math.floor(range.max / num1));

        // Problem templates for multiplication
        const templates = [
            {
                text: (n1, n2) => `There are ${n1} packs of crayons with ${n2} crayons in each pack. How many crayons are there in total?`,
                operation: (n1, n2) => n1 * n2,
                feedback: "Multiply the number of packs by the number of crayons per pack."
            },
            {
                text: (n1, n2) => `A classroom has ${n1} tables, and each table has ${n2} chairs. How many chairs are there altogether?`,
                operation: (n1, n2) => n1 * n2,
                feedback: "Multiply the number of tables by the number of chairs per table."
            },
            {
                text: (n1, n2) => `There are ${n1} baskets with ${n2} apples in each. How many apples are there in total?`,
                operation: (n1, n2) => n1 * n2,
                feedback: "Find the total by multiplying the baskets by apples per basket."
            }
        ];

        // Select a random template and generate the problem
        const template = templates[Utils.random(0, templates.length - 1)];
        const text = template.text(num1, num2);
        const correctAnswer = template.operation(num1, num2);

        this.questionText = text;
        this.correctAnswer = correctAnswer;
        this.difficulty = Math.ceil(correctAnswer / (range.max * 0.6));
        this.wrongAnswers = this.generateWrongAnswers({
            require_positive: true,
            min_wrong: 3
        });
        this.feedback = template.feedback;

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


// QuestionFactory Class
class QuestionFactory {
    static getQuestionTypes(grade) {
        // Define question types with their applicable grade ranges
        const types = [
                { type: CountingObjects, minGrade: 0, maxGrade: 0.5 },
                { type: Addition, minGrade: 0, maxGrade: 2.0 },
                { type: Subtraction, minGrade: 0, maxGrade: 2.0 },
                { type: PatternRecognition, minGrade: 0, maxGrade: 2.0 },
                { type: MoneyCounting, minGrade: 1.0, maxGrade: 2.0 },
                { type: NumberSequence, minGrade: 0, maxGrade: 2.0 },
                { type: ComparisonQuestion, minGrade: 0.5, maxGrade: 2.0 },
                { type: WordProbAdd, minGrade: 0.5, maxGrade: 2.0 },
                { type: WordProbSub, minGrade: 0.5, maxGrade: 2.0 },
                { type: WordProbDiv, minGrade: 0.5, maxGrade: 2.0 },
                { type: WordProbMult, minGrade: 0.5, maxGrade: 2.0 },
                { type: SkipCounting, minGrade: 0.5, maxGrade: 2.0 }
        ];

        // Filter types based on the current grade level
        return types
            .filter(({ minGrade = 0, maxGrade = Infinity }) => grade >= minGrade && grade <= maxGrade)
            .map(({ type }) => type);
    }

    static generate(grade) {
        const types = this.getQuestionTypes(grade);
        console.log(types.length);
        if (types.length === 0) {
            throw new Error(`No question types available for grade ${grade}.`);
        }
        const QuestionType = types[Math.floor(Math.random() * types.length)];
        return new QuestionType(grade).generate();
    }
}

// Exporting classes (if using modules)
// Uncomment the following lines if you are using ES6 modules
// export {
//     Question,
//     NumericalQuestion,
//     Addition,
//     Subtraction,
//     CountingObjects,
//     NumberSequence,
//     SkipCounting,
//     WordProblem,
//     ShapeIdentification,
//     ComparisonQuestion,
//     PatternRecognition,
//     MoneyCounting,
//     QuestionFactory
// };
