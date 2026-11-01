// money_problem.js
// Description: Generates money counting questions that scale smoothly with grade level

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
            { value: 100, visual: '💵$1', name: 'dollar', plural: 'dollars' },
            { value: 500, visual: '💵$5', name: 'five-dollar bill', plural: 'five-dollar bills' },
            { value: 1000, visual: '💵$10', name: 'ten-dollar bill', plural: 'ten-dollar bills' },
            { value: 2000, visual: '💵$20', name: 'twenty-dollar bill', plural: 'twenty-dollar bills' },
            { value: 10000, visual: '💵$100', name: 'hundred-dollar bill', plural: 'hundred-dollar bills' }
        ];
    }

    getAvailableCoins() {
        if (this.grade <= 0.5) return this.coins.slice(0, 1);  // Only pennies
        if (this.grade <= 1.0) return this.coins.slice(0, 3);  // Up to dimes
        if (this.grade <= 1.5) return this.coins.slice(0, 4);  // Up to quarters
        if (this.grade <= 2.0) return this.coins.slice(0, 6);  // Up to dollars
        if (this.grade <= 2.5) return this.coins.slice(0, 8);  // Up to $10
        return this.coins;  // All denominations
    }

    getMaxTotal() {
        if (this.grade <= 0.5) return 10;    // Up to 10 cents
        if (this.grade <= 1.0) return 25;    // Up to 25 cents
        if (this.grade <= 1.5) return 50;    // Up to 50 cents
        if (this.grade <= 2.0) return 100;   // Up to $1
        if (this.grade <= 2.5) return 500;   // Up to $5
        return 10000;                        // Up to $100
    }

    generate() {
        // Select question type based on grade
        if (this.grade <= 1.0) {
            return this.generateCoinCounting();
        } else if (this.grade <= 2.0) {
            return Math.random() < 0.5 ? 
                this.generateCoinCounting() : 
                this.generateMixedCoins();
        } else {
            return Math.random() < 0.5 ? 
                this.generateMixedCoins() : 
                this.generateMakingChange();
        }
    }

    generateCoinCounting() {
        const availableCoins = this.getAvailableCoins();
        const coin = availableCoins[Utils.random(0, availableCoins.length - 1)];
        const count = Utils.random(1, Math.min(2 + Math.floor(this.grade * 2), 10));
        
        const visuals = Array(count).fill(coin.visual).join(' ');
        const totalCents = count * coin.value;

        this.questionText = `How much money is this? ${visuals}`;
        this.correctAnswer = totalCents >= 100 ? 
            `$${(totalCents / 100).toFixed(2)}` : 
            `${totalCents}¢`;

        this.generateWrongAnswers(totalCents);
        this.feedback = `Count by ${coin.value}s.`;
        return this;
    }

    generateMixedCoins() {
        const availableCoins = this.getAvailableCoins();
        const maxTotal = this.getMaxTotal();
        const coinCount = Utils.random(2, 5);
        
        let selectedCoins = [];
        let totalCents = 0;

        while (selectedCoins.length < coinCount && totalCents < maxTotal) {
            const coin = availableCoins[Utils.random(0, availableCoins.length - 1)];
            if (totalCents + coin.value <= maxTotal) {
                selectedCoins.push(coin);
                totalCents += coin.value;
            }
        }

        const visuals = selectedCoins.map(coin => coin.visual).join(' ');
        this.questionText = `How much money is this? ${visuals}`;
        this.correctAnswer = totalCents >= 100 ? 
            `$${(totalCents / 100).toFixed(2)}` : 
            `${totalCents}¢`;

        this.generateWrongAnswers(totalCents);
        this.feedback = "Count each type of coin, then add them together.";
        return this;
    }

    generateMakingChange() {
        const maxTotal = this.getMaxTotal();
        const price = Utils.random(10, maxTotal / 2);
        const payment = Math.ceil(price / 100) * 100;
        const change = payment - price;

        this.questionText = `If something costs ${price < 100 ? price + '¢' : '$' + (price / 100).toFixed(2)} ` +
            `and you pay with $${(payment / 100).toFixed(2)}, how much change should you get back?`;

        this.correctAnswer = change >= 100 ? 
            `$${(change / 100).toFixed(2)}` : 
            `${change}¢`;

        this.generateWrongAnswers(change);
        this.feedback = "Count up from the price to the payment amount.";
        return this;
    }

    generateWrongAnswers(totalCents) {
        const variations = [
            totalCents + (this.grade <= 1.0 ? 1 : 5),
            totalCents - (this.grade <= 1.0 ? 1 : 5),
            totalCents * (this.grade <= 1.0 ? 2 : 1.5)
        ];

        this.wrongAnswers = variations.map(cents => 
            cents >= 100 ? 
                `$${(cents / 100).toFixed(2)}` : 
                `${Math.round(cents)}¢`
        );
    }
}

export { MoneyCounting };