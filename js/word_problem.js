import { NumericalQuestion } from './base_question.js';

// List of random names and nouns
const names = [
    "Mario", "Luigi", "Peach", "Sonic", "Knuckles",
    "Pikachu", "Charmander", "Squirtle", "Dora", "Diego",
    "Elsa", "Anna", "Olaf", "Moana", "Simba",
    "Buzz", "Woody", "Spiderman", "Batman", "Wonder Woman",
    "Harry", "Hermione", "Ron", "Katniss", "Shrek"
];

const nouns = [
    "apples", "balloons", "candies", "crayons", "stickers",
    "books", "flowers", "cookies", "pencils", "blocks",
    "stars", "hearts", "moons", "animals", "robots",
    "cars", "planes", "trains", "kites", "ice creams",
    "bicycles", "balls", "boats", "hats", "sandwiches"
];

// Utility functions for random names and nouns
function randomName() {
    return names[Math.floor(Math.random() * names.length)];
}

function randomNoun() {
    return nouns[Math.floor(Math.random() * nouns.length)];
}

class WordProblem extends NumericalQuestion {
    constructor(grade, templates) {
        super(grade);
        this.templates = templates;
    }

    generate() {
        const range = this.getNumberRange();
        const template = this.templates[Math.floor(Math.random() * this.templates.length)];

        // Generate operands based on the operation type
        const [num1, num2] = this.generateOperands(range, template.operationType);

        // Insert random names and nouns for personalization
        const name = randomName();
        const noun = randomNoun();

        // Populate the template
        this.questionText = template.text(num1, num2, name, noun);
        this.correctAnswer = template.operation(num1, num2);
        this.difficulty = Math.ceil(this.correctAnswer / (range.max * 0.6));
        this.wrongAnswers = this.generateWrongAnswers({
            requirePositive: true,
            minWrong: 3
        });
        this.feedback = template.feedback;

        return this;
    }

    generateOperands(range, operationType) {
        let num1, num2;

        switch (operationType) {
            case 'addition':
            case 'subtraction':
                // Use full range for addition and subtraction
                num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
                num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

                if (operationType === 'subtraction' && num1 < num2) {
                    // Ensure num1 >= num2 for subtraction
                    [num1, num2] = [num2, num1];
                }
                break;

            case 'multiplication':
                // Use smaller ranges for multiplication
                num1 = Math.floor(Math.random() * Math.min(range.max / 2, 10 - range.min)) + range.min;
                num2 = Math.floor(Math.random() * Math.min(range.max / 10, 10 - range.min)) + range.min;
                break;

            case 'division':
                // Ensure the dividend is a multiple of the divisor
                num2 = Math.floor(Math.random() * Math.min(range.max / 3, 5)) + 1; // Small divisors
                num1 = num2 * (Math.floor(Math.random() * 5) + 1); // Dividend is a multiple of divisor
                break;

            default:
                throw new Error(`Unsupported operation type: ${operationType}`);
        }

        return [num1, num2];
    }
}

// Define templates with placeholders for random names and nouns
const addTemplates = [
    {
        text: (n1, n2, name, noun) => `${name} has ${n1} ${noun} and finds ${n2} more. How many ${noun} does ${name} have in total?`,
        operation: (n1, n2) => n1 + n2,
        operationType: 'addition',
        feedback: "Add the quantities together to find the total."
    }
];

const subTemplates = [
    {
        text: (n1, n2, name, noun) => `${name} had ${n1} ${noun} and gave away ${n2}. How many ${noun} does ${name} have left?`,
        operation: (n1, n2) => n1 - n2,
        operationType: 'subtraction',
        feedback: "Subtract the given-away amount from the total."
    }
];

const divTemplates = [
    {
        text: (d, q, name, noun) => `${name} has ${d} ${noun} to share equally among ${q} friends. How many ${noun} does each friend get?`,
        operation: (d, q) => d / q,
        operationType: 'division',
        feedback: "Divide the total by the number of friends."
    }
];

const multTemplates = [
    {
        text: (n1, n2, name, noun) => `${name} bought ${n1} packs of ${noun}, each containing ${n2}. How many ${noun} did ${name} buy?`,
        operation: (n1, n2) => n1 * n2,
        operationType: 'multiplication',
        feedback: "Multiply the packs by the quantity per pack."
    }
];

// Define specific classes for each word problem type
class WordProbAdd extends WordProblem {
    constructor(grade) {
        super(grade, addTemplates);
    }
}

class WordProbSub extends WordProblem {
    constructor(grade) {
        super(grade, subTemplates);
    }
}

class WordProbDiv extends WordProblem {
    constructor(grade) {
        super(grade, divTemplates);
    }
}

class WordProbMult extends WordProblem {
    constructor(grade) {
        super(grade, multTemplates);
    }
}

// Export all classes
export { WordProbAdd, WordProbSub, WordProbDiv, WordProbMult };
