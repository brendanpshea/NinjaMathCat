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
            { value: 100, visual: '💵$1', name: 'dollar', plural: 'dollars' }
        ];
    }

    // Get available coins based on grade level
    getAvailableCoins() {
        // Smooth progression of coin introduction
        if (this.grade <= 0.5) return this.coins.slice(0, 1);  // Only pennies
        if (this.grade <= 1.0) return this.coins.slice(0, 2);  // Add nickels
        if (this.grade <= 1.5) return this.coins.slice(0, 3);  // Add dimes
        if (this.grade <= 2.0) return this.coins.slice(0, 4);  // Add quarters
        return this.coins;  // All coins
    }

    // Get maximum total based on grade level
    getMaxTotal() {
        // Smooth progression of maximum amounts
        if (this.grade <= 0.5) return 10;       // Up to 10 cents
        if (this.grade <= 1.0) return 25;       // Up to 25 cents
        if (this.grade <= 1.5) return 50;       // Up to 50 cents
        if (this.grade <= 2.0) return 100;      // Up to $1
        if (this.grade <= 2.5) return 200;      // Up to $2
        return 500;                             // Up to $5
    }

    // Get complexity level based on grade
    getComplexityLevel() {
        // Returns a value between 0 and 1 indicating complexity
        return Math.min(1, Math.max(0, (this.grade - 0.5) / 2.5));
    }

    generate() {
        // Probability distribution of question types based on grade
        const complexity = this.getComplexityLevel();
        
        // As grade increases, shift probability toward more complex questions
        const questionTypes = [
            { type: this.generateCoinCounting.bind(this), weight: 1 - complexity },
            { type: this.generateMixedCoins.bind(this), weight: complexity * 0.8 },
            { type: this.generateMakingChange.bind(this), weight: complexity * 0.6 },
            { type: this.generateWordProblem.bind(this), weight: complexity * 0.4 }
        ];

        // Filter out questions with zero weight and normalize remaining weights
        const validTypes = questionTypes.filter(t => t.weight > 0);
        const totalWeight = validTypes.reduce((sum, t) => sum + t.weight, 0);
        const normalizedTypes = validTypes.map(t => ({
            ...t,
            weight: t.weight / totalWeight
        }));

        // Select question type based on weighted probability
        const rand = Math.random();
        let accumWeight = 0;
        for (const type of normalizedTypes) {
            accumWeight += type.weight;
            if (rand <= accumWeight) {
                return type.type();
            }
        }

        return normalizedTypes[0].type(); // Fallback to first type
    }

    generateCoinCounting() {
        const availableCoins = this.getAvailableCoins();
        const maxCoins = Math.max(2, Math.floor(3 + this.grade * 2)); // Scales from 2 to 8 coins
        const count = Utils.random(1, Math.min(maxCoins, 10));
        const coin = availableCoins[Utils.random(0, availableCoins.length - 1)];
        
        const visuals = Array(count).fill(coin.visual).join(' ');
        const totalCents = count * coin.value;

        this.questionText = `How much money is this? ${visuals}`;
        this.correctAnswer = totalCents >= 100 ? 
            `$${(totalCents / 100).toFixed(2)}` : 
            `${totalCents}¢`;
        
        // Generate grade-appropriate wrong answers
        if (this.grade <= 1.0) {
            // Simple wrong answers for early grades
            this.wrongAnswers = [
                `${totalCents + coin.value}¢`,
                `${totalCents - coin.value}¢`,
                `${count}¢` // Common mistake: counting coins instead of value
            ];
        } else {
            this.wrongAnswers = this.generateWrongAnswers(totalCents / 100);
        }

        this.feedback = `Count by ${coin.value}s.`;
        return this;
    }

    generateMixedCoins() {
        const availableCoins = this.getAvailableCoins();
        const maxTotal = this.getMaxTotal();
        const complexity = this.getComplexityLevel();
        
        // Number of coins scales with grade and complexity
        const minCoins = Math.max(2, Math.floor(complexity * 3));
        const maxCoins = Math.max(3, Math.floor(complexity * 7));
        const targetCount = Utils.random(minCoins, maxCoins);
        
        const selectedCoins = [];
        let totalCents = 0;

        // Strategic coin selection based on grade level
        while (selectedCoins.length < targetCount && totalCents < maxTotal) {
            // Higher grades get more varied coin combinations
            const coinIndex = Utils.random(0, availableCoins.length - 1);
            const coin = availableCoins[coinIndex];
            
            if (totalCents + coin.value <= maxTotal) {
                selectedCoins.push(coin);
                totalCents += coin.value;
            }
        }

        const visuals = selectedCoins.map(coin => coin.visual).join(' + ');
        this.questionText = `How much money is this? ${visuals}`;
        this.correctAnswer = totalCents >= 100 ? 
            `$${(totalCents / 100).toFixed(2)}` : 
            `${totalCents}¢`;
        
        this.wrongAnswers = this.generateWrongAnswers(totalCents / 100);
        
        // Feedback becomes more sophisticated with grade level
        if (this.grade <= 1.5) {
            this.feedback = "Start with the largest coins and count down.";
        } else {
            this.feedback = "Group similar coins together, count each group, then add the totals.";
        }

        return this;
    }

    generateMakingChange() {
        const maxTotal = this.getMaxTotal();
        const complexity = this.getComplexityLevel();
        
        // Price increases with grade level
        const minPrice = Math.max(10, Math.floor(maxTotal * 0.2));
        const maxPrice = Math.floor(maxTotal * 0.8);
        const price = Utils.random(minPrice, maxPrice);
        
        // Payment amount scales with grade
        const payment = this.grade <= 2.0 ? 
            Math.ceil(price / 100) * 100 : // Round to next dollar for lower grades
            Math.ceil(price / 25) * 25;    // Round to quarter for higher grades
        
        const change = payment - price;

        // Question complexity increases with grade
        if (this.grade <= 2.0) {
            this.questionText = `If something costs ${price < 100 ? price + '¢' : '$' + (price / 100).toFixed(2)} ` +
                `and you pay with $${(payment / 100).toFixed(2)}, how much change should you get back?`;
        } else {
            const items = ['toy', 'book', 'lunch', 'game'];
            const item = items[Utils.random(0, items.length - 1)];
            this.questionText = `A ${item} costs $${(price / 100).toFixed(2)}. ` +
                `If you pay with $${(payment / 100).toFixed(2)}, how much change should you get back?`;
        }

        this.correctAnswer = change >= 100 ? 
            `$${(change / 100).toFixed(2)}` : 
            `${change}¢`;
        
        this.wrongAnswers = this.generateWrongAnswers(change / 100);
        
        // Feedback becomes more detailed with grade level
        if (this.grade <= 2.0) {
            this.feedback = "Count up from the price to the payment amount.";
        } else {
            this.feedback = "Subtract the price from the payment, or count up using coins and dollars.";
        }

        return this;
    }

    generateWordProblem() {
        const complexity = this.getComplexityLevel();
        const maxAmount = this.getMaxTotal();

        // Scenario complexity increases with grade
        const scenarios = [
            // Simple scenarios (lower grades)
            {
                minGrade: 0.5,
                template: (amount) => 
                    `You have ${amount < 100 ? amount + '¢' : '$' + (amount / 100).toFixed(2)} to spend. ` +
                    `If you buy a pencil for ${Math.floor(amount / 2)}¢, how much money do you have left?`,
                calculate: (amount) => amount - Math.floor(amount / 2)
            },
            // Medium complexity (middle grades)
            {
                minGrade: 1.5,
                template: (amount1, amount2) => 
                    `You have $${(amount1 / 100).toFixed(2)} and spend $${(amount2 / 100).toFixed(2)} ` +
                    `on lunch. How much money do you have left?`,
                calculate: (amount1, amount2) => amount1 - amount2
            },
            // Complex scenarios (higher grades)
            {
                minGrade: 2.5,
                template: (amount1, amount2, amount3) => 
                    `You need $${(amount1 / 100).toFixed(2)} for a toy. ` +
                    `You have saved $${(amount2 / 100).toFixed(2)} and your friend gives you $${(amount3 / 100).toFixed(2)}. ` +
                    `How much more do you need?`,
                calculate: (amount1, amount2, amount3) => amount1 - (amount2 + amount3)
            }
        ];

        // Filter scenarios based on grade level
        const availableScenarios = scenarios.filter(s => this.grade >= s.minGrade);
        const scenario = availableScenarios[Utils.random(0, availableScenarios.length - 1)];

        // Generate appropriate amounts based on grade level
        const amount1 = Utils.random(maxAmount * 0.4, maxAmount);
        const amount2 = Utils.random(maxAmount * 0.2, maxAmount * 0.6);
        const amount3 = Utils.random(maxAmount * 0.1, maxAmount * 0.3);

        this.questionText = scenario.template(amount1, amount2, amount3);
        const result = Math.abs(scenario.calculate(amount1, amount2, amount3));

        this.correctAnswer = result >= 100 ? 
            `$${(result / 100).toFixed(2)}` : 
            `${result}¢`;

        this.wrongAnswers = this.generateWrongAnswers(result / 100);

        // Feedback complexity scales with grade
        if (this.grade <= 2.0) {
            this.feedback = "Write out the numbers and solve step by step.";
        } else {
            this.feedback = "Break down the problem into smaller parts: list what you have and what you need, then solve.";
        }

        return this;
    }

    generateWrongAnswers(correctAmount) {
        // Scale the variation in wrong answers with grade level
        const variation = Math.max(0.1, Math.min(0.5, this.grade * 0.2));
        
        const numericalWrongAnswers = generateWrongAnswersForNumerical(correctAmount, this.grade, {
            require_positive: true,
            min_wrong: 3,
            max_difference: correctAmount * variation
        });

        return numericalWrongAnswers.map(amount => 
            amount < 1 ? `${Math.round(amount * 100)}¢` : `$${amount.toFixed(2)}`
        );
    }
}

export { MoneyCounting };