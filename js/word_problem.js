// word_problem.js
// Description: Classes for generating word problems based on basic arithmetic operations.

import {QuestUtils, Question, NumericalQuestion, generateWrongAnswersForNumerical } from './base_question.js';


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

// export all classes
export { WordProbAdd, WordProbSub, WordProbDiv, WordProbMult };