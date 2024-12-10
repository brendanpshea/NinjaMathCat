// money_problem.js
// Description: Generates money counting questions based on grade level.

import {generateWrongAnswersForNumerical, NumericalQuestion } from "./base_question.js";

class MoneyCounting extends NumericalQuestion {
    constructor(grade) {
        super(grade);
        this.coins = [
            { value: 1, visual: '🪙1¢', name: 'penny', plural: 'pennies' },
            { value: 5, visual: '🪙5¢', name: 'nickel', plural: 'nickels' },
            { value: 10, visual: '🪙10¢', name: 'dime', plural: 'dimes' },
            { value: 25, visual: '🪙25¢', name: 'quarter', plural: 'quarters' },
            { value: 50, visual: '🪙50¢', name: 'half dollar', plural: 'half dollars' },
            { value: 100, visual: '💵$1', name: 'dollar', plural: 'dollars' }
        ];
    }

    generate() {
        if (this.grade <= 0.5) {
            return this.generateKindergarten();
        } else if (this.grade <= 1.0) {
            return this.generateFirstGrade();
        } else if (this.grade <= 2.0) {
            return this.generateSecondGrade();
        } else if (this.grade <= 2.5) {
            return this.generateMidSecondGrade();
        } else {
            return this.generateThirdGrade();
        }
    }

    /**
     * Kindergarten (Grade 0-0.5)
     * Focus: Penny recognition, counting pennies up to 10
     */
    generateKindergarten() {
        const count = Utils.random(1, 10);
        const penny = this.coins[0];
        const visuals = Array(count).fill(penny.visual).join(' ');

        this.questionText = `How many pennies are there? ${visuals}`;
        this.correctAnswer = count === 1 ? "1 penny" : `${count} pennies`;
        this.wrongAnswers = this.generateCountingWrongAnswers(count, "penny", "pennies");
        this.feedback = "Count each penny one by one.";

        return this;
    }

    /**
     * First Grade (Grade 1.0)
     * Focus: Pennies, nickels, and dimes; counting up to 25 cents
     */
    generateFirstGrade() {
        const questionTypes = [
            this.generateSingleCoinCounting.bind(this),
            this.generateSimpleMixedCoins.bind(this)
        ];
        return questionTypes[Utils.random(0, questionTypes.length - 1)]();
    }

    generateSingleCoinCounting() {
        const availableCoins = this.coins.slice(0, 3); // Pennies, nickels, dimes
        const coin = availableCoins[Utils.random(0, availableCoins.length - 1)];
        const count = Utils.random(1, Math.min(5, Math.floor(25 / coin.value)));
        const visuals = Array(count).fill(coin.visual).join(' ');
        const totalCents = count * coin.value;

        this.questionText = `How much money is this? ${visuals}`;
        this.correctAnswer = `${totalCents}¢`;
        this.wrongAnswers = [
            `${totalCents + coin.value}¢`,
            `${totalCents - coin.value}¢`,
            `${count}¢` // Common mistake: counting coins instead of value
        ];
        this.feedback = `Count by ${coin.value}s.`;

        return this;
    }

    generateSimpleMixedCoins() {
        const availableCoins = this.coins.slice(0, 2); // Just pennies and nickels for mixed
        const count = Utils.random(2, 4);
        const selectedCoins = [];
        let totalCents = 0;

        while (selectedCoins.length < count && totalCents < 25) {
            const coin = availableCoins[Utils.random(0, availableCoins.length - 1)];
            if (totalCents + coin.value <= 25) {
                selectedCoins.push(coin);
                totalCents += coin.value;
            }
        }

        const visuals = selectedCoins.map(coin => coin.visual).join(' + ');
        this.questionText = `How much money is this? ${visuals}`;
        this.correctAnswer = `${totalCents}¢`;
        this.wrongAnswers = [
            `${totalCents + 5}¢`,
            `${totalCents - 1}¢`,
            `${selectedCoins.length}¢` // Common mistake: counting coins instead of value
        ];
        this.feedback = "Count the nickels first, then add the pennies.";

        return this;
    }

    /**
     * Second Grade (Grade 2.0)
     * Focus: All coins up to quarters, amounts up to $1
     */
    generateSecondGrade() {
        const questionTypes = [
            this.generateQuarterCounting.bind(this),
            this.generateMixedCoinsCounting.bind(this),
            this.generateSimpleMakingChange.bind(this)
        ];
        return questionTypes[Utils.random(0, questionTypes.length - 1)]();
    }

    generateQuarterCounting() {
        const count = Utils.random(1, 3);
        const quarter = this.coins[3]; // Quarter
        const visuals = Array(count).fill(quarter.visual).join(' + ');
        const totalCents = count * quarter.value;

        this.questionText = `How much money is this? ${visuals}`;
        this.correctAnswer = `${totalCents}¢`;
        this.wrongAnswers = [
            `${totalCents + 25}¢`,
            `${totalCents - 25}¢`,
            `${count}¢` // Common mistake
        ];
        this.feedback = "Count by 25s.";

        return this;
    }

    generateMixedCoinsCounting() {
        const availableCoins = this.coins.slice(0, 4); // Up to quarters
        const count = Utils.random(3, 5);
        const selectedCoins = [];
        let totalCents = 0;

        while (selectedCoins.length < count && totalCents < 100) {
            const coin = availableCoins[Utils.random(0, availableCoins.length - 1)];
            if (totalCents + coin.value <= 100) {
                selectedCoins.push(coin);
                totalCents += coin.value;
            }
        }

        const visuals = selectedCoins.map(coin => coin.visual).join(' + ');
        this.questionText = `How much money is this? ${visuals}`;
        this.correctAnswer = totalCents >= 100 ? '$1.00' : `${totalCents}¢`;
        this.wrongAnswers = this.generateWrongAnswers(totalCents / 100);
        this.feedback = "Start with the quarters, then count down to pennies.";

        return this;
    }

    /**
     * Mid-Second Grade (Grade 2.5)
     * Focus: Mixed coins and bills up to $2, introduction to decimal notation
     */
    generateMidSecondGrade() {
        const questionTypes = [
            this.generateMixedMoneyUpToTwo.bind(this),
            this.generateSimpleMakingChange.bind(this),
            this.generateBasicMoneyWord.bind(this)
        ];
        return questionTypes[Utils.random(0, questionTypes.length - 1)]();
    }

    generateMixedMoneyUpToTwo() {
        const maxAmount = 200; // $2.00
        const count = Utils.random(3, 5);
        const selectedCoins = [];
        let totalCents = 0;

        while (selectedCoins.length < count && totalCents < maxAmount) {
            const coin = this.coins[Utils.random(0, this.coins.length - 1)];
            if (totalCents + coin.value <= maxAmount) {
                selectedCoins.push(coin);
                totalCents += coin.value;
            }
        }

        const visuals = selectedCoins.map(coin => coin.visual).join(' + ');
        this.questionText = `How much money is this? ${visuals}`;
        this.correctAnswer = `$${(totalCents / 100).toFixed(2)}`;
        this.wrongAnswers = this.generateWrongAnswers(totalCents / 100);
        this.feedback = "Count dollars first, then add the coins.";

        return this;
    }

    generateSimpleMakingChange() {
        const price = Utils.random(10, 90); // Up to 90 cents
        const payment = 100; // $1.00
        const change = payment - price;

        this.questionText = `If something costs ${price}¢ and you pay with $1.00, how much change should you get back?`;
        this.correctAnswer = `${change}¢`;
        this.wrongAnswers = [
            `${change + 5}¢`,
            `${change - 5}¢`,
            `${change + 10}¢`
        ];
        this.feedback = "Subtract from 100¢ or count up from the price to $1.00.";

        return this;
    }

    /**
     * Third Grade (Grade 3.0)
     * Focus: Complex money problems, making change, decimal notation
     */
    generateThirdGrade() {
        const questionTypes = [
            this.generateComplexMakingChange.bind(this),
            this.generateMoneyWordProblem.bind(this),
            this.generateMultiStepProblem.bind(this)
        ];
        return questionTypes[Utils.random(0, questionTypes.length - 1)]();
    }

    generateComplexMakingChange() {
        const price = Utils.random(150, 450); // $1.50 to $4.50
        const payment = Math.ceil(price / 100) * 100; // Round up to next dollar
        const change = payment - price;

        this.questionText = `If something costs $${(price / 100).toFixed(2)} and you pay with $${(payment / 100).toFixed(2)}, how much change should you get back?`;
        this.correctAnswer = `$${(change / 100).toFixed(2)}`;
        this.wrongAnswers = this.generateWrongAnswers(change / 100);
        this.feedback = "Subtract the price from the payment, or count up from the price.";

        return this;
    }

    generateMoneyWordProblem() {
        const scenarios = [
            {
                template: (amount1, amount2) => 
                    `You have $${amount1.toFixed(2)} and spend $${amount2.toFixed(2)} on lunch. How much money do you have left?`,
                calculate: (amount1, amount2) => amount1 - amount2
            },
            {
                template: (amount1, amount2) => 
                    `You need $${amount1.toFixed(2)} for a toy. You have saved $${amount2.toFixed(2)}. How much more do you need?`,
                calculate: (amount1, amount2) => amount1 - amount2
            }
        ];

        const scenario = scenarios[Utils.random(0, scenarios.length - 1)];
        const amount1 = Utils.random(200, 500) / 100; // $2.00 to $5.00
        const amount2 = Utils.random(100, Math.floor(amount1 * 100)) / 100;
        const result = scenario.calculate(amount1, amount2);

        this.questionText = scenario.template(amount1, amount2);
        this.correctAnswer = `$${Math.abs(result).toFixed(2)}`;
        this.wrongAnswers = this.generateWrongAnswers(Math.abs(result));
        this.feedback = "Write out the problem and solve step by step.";

        return this;
    }

    generateMultiStepProblem() {
        const item1Price = Utils.random(100, 300) / 100;
        const item2Price = Utils.random(100, 300) / 100;
        const payment = Math.ceil((item1Price + item2Price) * 2) * 100 / 100;
        const total = item1Price + item2Price;
        const change = payment - total;

        this.questionText = `You buy two items at the store: one costs $${item1Price.toFixed(2)} and another costs $${item2Price.toFixed(2)}. If you pay with $${payment.toFixed(2)}, how much change should you get back?`;
        this.correctAnswer = `$${change.toFixed(2)}`;
        this.wrongAnswers = this.generateWrongAnswers(change);
        this.feedback = "First add the prices, then subtract from the payment amount.";

        return this;
    }

    generateBasicMoneyWord() {
        const amount = Utils.random(25, 200);
        const items = ['toy', 'book', 'game', 'lunch'];
        const item = items[Utils.random(0, items.length - 1)];

        this.questionText = `A ${item} costs ${amount}¢. How many dollars and cents is that?`;
        this.correctAnswer = `$${(amount / 100).toFixed(2)}`;
        this.wrongAnswers = [
            `$${(amount / 10).toFixed(2)}`,
            `$${(amount).toFixed(2)}`,
            `${amount}¢`
        ];
        this.feedback = "Divide the cents by 100 to get dollars.";

        return this;
    }

    generateCountingWrongAnswers(count, singular, plural) {
        const wrongCounts = [
            count + 1,
            count - 1,
            count + 2
        ].filter(n => n > 0);

        return wrongCounts.map(n => 
            n === 1 ? `1 ${singular}` : `${n} ${plural}`
        );
    }

    generateWrongAnswers(correctAmount) {
        const numericalWrongAnswers = generateWrongAnswersForNumerical(correctAmount, this.grade, {
            require_positive: true,
            min_wrong: 3,
            max_difference: correctAmount * 0.5
        });

        return numericalWrongAnswers.map(amount => 
            amount < 1 ? `${(amount * 100)}¢` : `$${amount.toFixed(2)}`
        );
    }
}

export { MoneyCounting };