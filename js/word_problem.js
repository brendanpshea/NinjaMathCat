import { NumericalQuestion } from './base_question.js';

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

        const [num1, num2] = this.generateOperands(range, template.operationType);

        const name = randomName();
        const noun = randomNoun();

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
        // Scale down by an order of magnitude and ensure a minimum
        const scaledMax = Math.max(3, Math.floor(range.max / 10));

        let num1, num2;

        switch (operationType) {
            case 'addition':
                // Slightly larger but still small, ensure >= 2
                num1 = Math.floor(Math.random() * scaledMax) + 2;
                num2 = Math.floor(Math.random() * scaledMax) + 2;
                break;

            case 'subtraction':
                num1 = Math.floor(Math.random() * scaledMax) + 2;
                num2 = Math.floor(Math.random() * scaledMax) + 2;
                if (num1 < num2) {
                    [num1, num2] = [num2, num1];
                }
                break;

            case 'multiplication':
                // Both > 1 and small
                num1 = Math.floor(Math.random() * (scaledMax - 1)) + 2;
                num2 = Math.floor(Math.random() * (scaledMax - 1)) + 2;
                break;

            case 'division':
                // Divisor > 1, scaled range
                num2 = Math.floor(Math.random() * (scaledMax - 1)) + 2;
                // Dividend is a multiple of divisor, also > divisor
                const multiplier = Math.floor(Math.random() * (scaledMax - 1)) + 2;
                num1 = num2 * multiplier;
                break;

            default:
                throw new Error(`Unsupported operation type: ${operationType}`);
        }

        return [num1, num2];
    }
}

const addTemplates = [
    {
        text: (n1, n2, name, noun) => `${name} has ${n1} ${noun} and then finds ${n2} more ${noun}. How many ${noun} are there altogether?`,
        operation: (n1, n2) => n1 + n2,
        operationType: 'addition',
        feedback: "Add the two numbers to find the total."
    },
    {
        text: (n1, n2, name, noun) => `${name} collected ${n1} ${noun} in the morning and ${n2} ${noun} later in the day. How many ${noun} are there in total?`,
        operation: (n1, n2) => n1 + n2,
        operationType: 'addition',
        feedback: "Add the quantities together to get the total."
    }
];

const subTemplates = [
    {
        text: (n1, n2, name, noun) => `${name} started with ${n1} ${noun} and gave away ${n2}. How many ${noun} remain?`,
        operation: (n1, n2) => n1 - n2,
        operationType: 'subtraction',
        feedback: "Subtract the given-away amount from the total."
    },
    {
        text: (n1, n2, name, noun) => `${name} had ${n1} ${noun} and lost ${n2} along the way. How many ${noun} are left?`,
        operation: (n1, n2) => n1 - n2,
        operationType: 'subtraction',
        feedback: "Subtract the lost amount to find what remains."
    }
];

const divTemplates = [
    {
        text: (d, q, name, noun) => `${name} has ${d} ${noun} to be shared equally among ${q} friends. How many ${noun} does each friend get?`,
        operation: (d, q) => d / q,
        operationType: 'division',
        feedback: "Divide the total by the number of friends."
    },
    {
        text: (d, q, name, noun) => `${name} arranges ${d} ${noun} into ${q} equal groups. How many ${noun} are in each group?`,
        operation: (d, q) => d / q,
        operationType: 'division',
        feedback: "Divide the total by the number of groups."
    }
];

const multTemplates = [
    {
        text: (n1, n2, name, noun) => `${name} has ${n1} boxes with ${n2} ${noun} in each box. How many ${noun} are there in total?`,
        operation: (n1, n2) => n1 * n2,
        operationType: 'multiplication',
        feedback: "Multiply the two numbers to find the total."
    },
    {
        text: (n1, n2, name, noun) => `${name} sets up ${n1} rows of ${noun}, with ${n2} in each row. How many ${noun} are there altogether?`,
        operation: (n1, n2) => n1 * n2,
        operationType: 'multiplication',
        feedback: "Multiply the number of rows by the amount in each row."
    }
];

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

export { WordProbAdd, WordProbSub, WordProbDiv, WordProbMult };
