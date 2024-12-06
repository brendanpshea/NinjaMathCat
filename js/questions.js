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

class Addition extends Question {
    generate() {
        const range = this.getNumberRange();
        const num1 = Utils.random(range.min, range.max);
        const num2 = Utils.random(range.min, range.max);
        
        this.questionText = `What is ${num1} + ${num2}?`;
        this.correctAnswer = num1 + num2;
        this.difficulty = Math.ceil((num1 + num2) / (range.max * 0.6));
        this.wrongAnswers = this.generateWrongAnswers();
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
        return Array.from(answers);
    }
}

class Subtraction extends Question {
    generate() {
        const range = this.getNumberRange();
        let num1 = Utils.random(range.min, range.max);
        let num2 = Utils.random(range.min, range.max);
        
        if (num1 < num2) [num1, num2] = [num2, num1];
        
        this.questionText = `What is ${num1} - ${num2}?`;
        this.correctAnswer = num1 - num2;
        this.difficulty = Math.ceil(num1 / (range.max * 0.6));
        this.wrongAnswers = this.generateWrongAnswers();
        this.feedback = "Count backwards from the larger number.";
        
        return this;
    }

    generateWrongAnswers() {
        const answers = new Set();
        while (answers.size < 3) {
            const wrong = this.correctAnswer + (Utils.random(0, 1) ? 1 : -1) * 
                Utils.random(1, Math.max(2, Math.floor(this.grade * 3)));
            if (wrong >= 0 && wrong !== this.correctAnswer) answers.add(wrong);
        }
        return Array.from(answers);
    }
}

class CountingObjects extends Question {
    generate() {
        const range = this.getNumberRange();
        const count = Utils.random(range.min, range.max);
        const objects = this.grade <= 0.5 ? '🔵' : ['🔵', '🌟', '❤️', '🎈'][Utils.random(0, 3)];
        
        this.questionText = `Count the ${objects}: ${objects.repeat(count)}`;
        this.correctAnswer = count;
        this.difficulty = Math.ceil(count / (range.max * 0.6));
        this.wrongAnswers = this.generateWrongAnswers();
        this.feedback = count > 10 ? "Try counting by groups of 2 or 5!" : "Touch each object as you count!";
        
        return this;
    }

    generateWrongAnswers() {
        const answers = new Set();
        while (answers.size < 3) {
            const wrong = this.correctAnswer + (Utils.random(0, 1) ? 1 : -1) * 
                Utils.random(1, Math.max(2, Math.floor(this.grade * 2)));
            if (wrong > 0 && wrong !== this.correctAnswer) answers.add(wrong);
        }
        return Array.from(answers);
    }
}

class NumberSequence extends Question {
    generate() {
        const range = this.getNumberRange();
        const num = Utils.random(range.min, range.max - 1);
        const isBefore = Utils.random(0, 1) === 1;
        
        this.questionText = isBefore ? 
            `What number comes before ${num}?` : 
            `What number comes after ${num}?`;
        this.correctAnswer = isBefore ? num - 1 : num + 1;
        this.difficulty = 1;
        this.wrongAnswers = [
            isBefore ? num + 1 : num - 1,
            num,
            isBefore ? num + 2 : num - 2
        ];
        this.feedback = isBefore ? 
            "Count backwards one number." : 
            "Count forward one number.";
        
        return this;
    }
}

class SkipCounting extends Question {
    generate() {
        const skipBy = this.grade <= 1.0 ? 2 : [2, 5, 10][Utils.random(0, 2)];
        const startNum = Utils.random(0, 5) * skipBy;
        
        this.questionText = `What comes next: ${startNum}, ${startNum + skipBy}, ${startNum + (skipBy * 2)}, ___?`;
        this.correctAnswer = startNum + (skipBy * 3);
        this.difficulty = Math.ceil(skipBy / 4);
        this.wrongAnswers = [
            startNum + (skipBy * 3) + 1,
            startNum + (skipBy * 3) - 1,
            startNum + (skipBy * 2) + skipBy + 2
        ];
        this.feedback = `Count by ${skipBy}s to find the pattern.`;
        
        return this;
    }
}

class WordProblem extends Question {
    generate() {
        const range = this.getNumberRange();
        const num1 = Utils.random(range.min, range.max);
        const num2 = Utils.random(range.min, Math.min(num1, range.max));
        const num3 = Utils.random(range.min, range.max);

        // Ensure no remainder for division problems
        const divisor = Utils.random(1, 5);
        const divisibleNum = divisor * Utils.random(1, 5);

        // Problem templates by grade
        const templates = this.grade <= 0.5
            ? [ // Simple addition/subtraction for Kindergarten
                {
                    text: (n1, n2) => `You have ${n1} apples and find ${n2} more. How many apples do you have?`,
                    operation: (n1, n2) => n1 + n2,
                    feedback: "Add the apples together."
                },
                {
                    text: (n1, n2) => `You have ${n1} cookies. You eat ${n2} cookies. How many are left?`,
                    operation: (n1, n2) => n1 - n2,
                    feedback: "Take away the cookies you ate."
                }
            ]
            : this.grade <= 1.0
            ? [ // Addition, subtraction, and simple division for Grade 1
                {
                    text: (n1, n2) => `Mario finds ${n1} coins and spends ${n2}. How many coins does he have left?`,
                    operation: (n1, n2) => n1 - n2,
                    feedback: "Subtract the spent coins from the total."
                },
                {
                    text: (n1, divisor) => `Harry Potter has ${n1} chocolate frogs. He shares them equally with ${divisor} friends. How many frogs does each friend get?`,
                    operation: (n1, divisor) => n1 / divisor,
                    feedback: "Divide the total frogs by the number of friends."
                }
            ]
            : [ // Mixed operations with multi-step problems for Grade 2
                {
                    text: (n1, n2, n3) => `Percy Jackson has ${n1} drachmas. He buys a sword for ${n2} drachmas and a shield for ${n3} drachmas. How many drachmas does Percy have left?`,
                    operation: (n1, n2, n3) => n1 - n2 - n3,
                    feedback: "Subtract both purchases from Percy's total drachmas."
                },
                {
                    text: (n1, divisor) => `Zelda collects ${n1} rupees and divides them equally among ${divisor} adventurers. How many rupees does each adventurer get?`,
                    operation: (n1, divisor) => n1 / divisor,
                    feedback: "Divide the total rupees by the number of adventurers."
                },
                {
                    text: (n1, n2, n3) => `Dorothy has ${n1} ruby slippers. She gives ${n2} pairs to the Munchkins and ${n3} pairs to Glinda. How many pairs does Dorothy have left?`,
                    operation: (n1, n2, n3) => n1 - n2 - n3,
                    feedback: "Subtract the slippers given to the Munchkins and Glinda."
                }
            ];

        // Select a random template and generate the problem
        const template = templates[Utils.random(0, templates.length - 1)];
        const text = template.text(num1, num2, num3, divisibleNum, divisor);
        const correctAnswer = template.operation(num1, num2, num3, divisibleNum, divisor);

        this.questionText = text;
        this.correctAnswer = correctAnswer;
        this.difficulty = this.grade <= 1.0 ? 1 : 2; // Scale difficulty
        this.wrongAnswers = this.generateWrongAnswers(correctAnswer);
        this.feedback = template.feedback;

        return this;
    }

    generateWrongAnswers(correctAnswer) {
        const answers = new Set();
        while (answers.size < 3) {
            const wrong = correctAnswer + (Utils.random(0, 1) ? 1 : -1) * 
                Utils.random(1, Math.max(2, Math.floor(this.grade * 2)));
            if (wrong > 0 && wrong !== correctAnswer) {
                answers.add(wrong);
            }
        }
        return Array.from(answers);
    }
}


class ShapeIdentification extends Question {
    generate() {
        const shapes = ['circle', 'square', 'triangle', 'rectangle'];
        const correctShape = shapes[Utils.random(0, shapes.length - 1)];
        
        this.questionText = `Which of these is a ${correctShape}?`;
        this.correctAnswer = correctShape;
        this.wrongAnswers = shapes.filter(shape => shape !== correctShape);
        this.feedback = "Look at the shape carefully and compare its sides and corners.";
        
        return this;
    }
}

class ComparisonQuestion extends Question {
    generate() {
        const range = this.getNumberRange();
        const num1 = Utils.random(range.min, range.max);
        const num2 = Utils.random(range.min, range.max);

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
        this.wrongAnswers = this.generateWrongAnswers(correctIndex, possibleAnswers);
        this.feedback = `Compare the two numbers carefully to find whether one is bigger, smaller, or equal.`;

        return this;
    }

    generateWrongAnswers(correctIndex, possibleAnswers) {
        // Create a set of indices for all answers except the correct one
        const wrongIndices = new Set([0, 1, 2, 3]);
        wrongIndices.delete(correctIndex);

        // Convert the set to an array, shuffle, and select three wrong indices
        const selectedWrongIndices = Utils.shuffle(Array.from(wrongIndices)).slice(0, 3);

        // Map the selected indices back to the actual answers
        const wrongAnswers = selectedWrongIndices.map(index => possibleAnswers[index]);

        // Combine with the correct answer and shuffle
        return wrongAnswers
    }
}



class PatternRecognition extends Question {
    generate() {
        const range = this.getNumberRange();
        const patternLength = this.grade <= 0.5 ? 2 : Utils.random(3, 5); // Shorter patterns for younger grades
        const repetitions = this.grade <= 0.5 ? 3 : 4; // Adjust repetition based on grade
        
        // Fun and varied Unicode emojis for patterns
        const patternsPool = [
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
        

        // Randomly select a pattern type from the pool
        const selectedPattern = patternsPool[Utils.random(0, patternsPool.length - 1)];

        // Generate the pattern
        const pattern = Array.from({ length: patternLength }, () => selectedPattern[Utils.random(0, selectedPattern.length - 1)]);
        const fullPattern = Array(repetitions).fill(pattern).flat();

        // Insert a blank in the repeated pattern
        const missingIndex = Utils.random(0, fullPattern.length - 1);
        const correctAnswer = fullPattern[missingIndex];
        fullPattern[missingIndex] = '___';

        this.questionText = `Complete the repeating pattern: ${fullPattern.join(' ')}`;
        this.correctAnswer = correctAnswer;
        this.wrongAnswers = selectedPattern.filter(item => item !== correctAnswer).slice(0, 3);
        this.feedback = "Look for the repeated sequence to identify the missing element.";

        return this;
    }
}


class MoneyCounting extends Question {
    generate() {
        // Define coins and their corresponding visuals
        const coins = [
            { value: 1, visual: '🪙1¢' },  // Penny
            { value: 5, visual: '🪙5¢' },  // Nickel
            { value: 10, visual: '🪙10¢' }, // Dime
            { value: 25, visual: '🪙25¢' }, // Quarter
            { value: 50, visual: '🪙50¢' }, // Half Dollar (optional for higher grades)
            { value: 100, visual: '💵$1' }  // Dollar Bill
        ];

        // Adjust difficulty based on grade level
        const count = this.grade <= 1.0 ? 2 : Utils.random(3, 5); // Fewer coins for younger students
        const selectedCoins = Array.from({ length: count }, () => coins[Utils.random(0, coins.length - 1)]);
        
        // Calculate the total value
        const total = selectedCoins.reduce((sum, coin) => sum + coin.value, 0);

        // Generate the visuals for the question
        const visuals = selectedCoins.map(coin => coin.visual).join('');

        this.questionText = `How much money is this? ${visuals}`;
        this.correctAnswer = `$${(total / 100).toFixed(2)}`; // Convert cents to dollars and format as currency
        this.wrongAnswers = this.generateWrongAnswers(total / 100);
        this.feedback = "Carefully add the values of the coins and dollars.";

        return this;
    }

    generateWrongAnswers(correctAnswer) {
        const answers = new Set();
        while (answers.size < 3) {
            const wrong = correctAnswer + (Utils.random(0, 1) ? 0.01 : -0.01) * Utils.random(1, 10);
            if (wrong > 0 && wrong.toFixed(2) !== correctAnswer.toFixed(2)) {
                answers.add(`$${wrong.toFixed(2)}`);
            }
        }
        return Array.from(answers);
    }
}



class QuestionFactory {
    static getQuestionTypes(grade) {
        // Adjust available question types by grade level
        const types = [
            { type: CountingObjects, maxGrade: 0.5 },
            { type: Addition, maxGrade: 2.0 },
            { type: Subtraction, maxGrade: 2.0 },
            { type: PatternRecognition, maxGrade: 2.0 },
            { type: MoneyCounting, minGrade: 1.0, maxGrade: 2.0 },
            { type: NumberSequence, maxGrade: 2.0 },
            { type: ComparisonQuestion, minGrade: 0.5, maxGrade: 2.0 },
            { type: WordProblem, minGrade: 0.5, maxGrade: 2.0 },
            { type: SkipCounting, minGrade: 0.5, maxGrade: 2.0 }
        ];

        // Filter types for the current grade level
        return types
            .filter(({ minGrade = 0, maxGrade = Infinity }) => grade >= minGrade && grade <= maxGrade)
            .map(({ type }) => type);
    }

    static generate(grade) {
        const types = this.getQuestionTypes(grade);
        const QuestionType = types[Math.floor(Math.random() * types.length)];
        return new QuestionType(grade).generate();
    }
}
