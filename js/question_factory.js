// question_factory.js
console.log('Executing question_factory.js');


import { CountingObjects, Addition, Subtraction, PatternRecognition, NumberSequence, ComparisonQuestion, SkipCounting, ShapeProperties } from "./question_types.js";
import { WordProbAdd, WordProbMult, WordProbSub, WordProbDiv } from "./word_problem.js";
import { MoneyCounting } from "./money_problem.js";
import { TimeQuestion } from "./time_question.js";

class QuestionFactory {  // Changed to export class directly
    static getQuestionTypes(grade) {
        const types = [
            { type: CountingObjects, minGrade: 0, maxGrade: 0.5 },
            { type: Addition, minGrade: 0, maxGrade: 3.0 },
            { type: Subtraction, minGrade: 0, maxGrade: 3.0 },
            { type: PatternRecognition, minGrade: 0, maxGrade: 1.5 },
            { type: MoneyCounting, minGrade: 1.0, maxGrade: 3.0 },
            { type: NumberSequence, minGrade: 0, maxGrade: 1.0 },
            { type: ComparisonQuestion, minGrade: 0.5, maxGrade: 3.0 },
            { type: WordProbAdd, minGrade: 0.5, maxGrade: 3.0 },
            { type: WordProbSub, minGrade: 0.5, maxGrade: 3.0 },
            { type: WordProbDiv, minGrade: 0.5, maxGrade: 3.0 },
            { type: WordProbMult, minGrade: 0.5, maxGrade: 3.0 },
            { type: SkipCounting, minGrade: 0.5, maxGrade: 3.0 },
            { type: TimeQuestion, minGrade: 0.5, maxGrade: 3.0 },
            { type: ShapeProperties, minGrade: 0.5, maxGrade: 3.0 }
        ];

        return types
            .filter(({ minGrade = 0, maxGrade = Infinity }) => grade >= minGrade && grade <= maxGrade)
            .map(({ type }) => type);
    }


    static generate(grade) {
        const types = this.getQuestionTypes(grade);
        console.log(`Available types for grade ${grade}:`, types.map(t => t.name));
    
        if (types.length === 0) {
            throw new Error(`No question types available for grade ${grade}.`);
        }
    
        const QuestionType = types[Math.floor(Math.random() * types.length)];
        console.log(`Selected QuestionType for grade ${grade}:`, QuestionType.name);
    
        const questionInstance = new QuestionType(grade);
        const generatedQuestion = questionInstance.generate();
    
        console.log('Generated question:', generatedQuestion);
    
        return generatedQuestion;
    }
    

    static async stressTest() {
        console.log('Starting QuestionFactory stress test...');
        
        const gradestoTest = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
        const questionsPerGrade = 1000;
        const timeoutThreshold = 100; // ms
    
        const results = {
            totalQuestions: 0,
            successfulQuestions: 0,
            failedQuestions: 0,
            slowQuestions: 0,
            errorsByGradeAndType: new Map(),
            slowByGradeAndType: new Map(),
            averageTimeByType: new Map(),
            typeFrequency: new Map()
        };
    
        for (const grade of gradestoTest) {
            console.log(`\nTesting grade ${grade}...`);
            
            for (let i = 0; i < questionsPerGrade; i++) {
                let type = null;
                try {
                    const startTime = performance.now();
                    const question = this.generate(grade);
                    const endTime = performance.now();
                    const duration = endTime - startTime;
    
                    results.totalQuestions++;
                    
                    if (!this.validateQuestion(question)) {
                        throw new Error('Invalid question structure');
                    }
    
                    results.successfulQuestions++;
    
                    type = question.constructor.name;
                    results.typeFrequency.set(type, (results.typeFrequency.get(type) || 0) + 1);
    
                    if (!results.averageTimeByType.has(type)) {
                        results.averageTimeByType.set(type, []);
                    }
                    results.averageTimeByType.get(type).push(duration);
    
                    if (duration > timeoutThreshold) {
                        results.slowQuestions++;
                        const slowKey = `${grade}-${type}`;
                        results.slowByGradeAndType.set(slowKey, (results.slowByGradeAndType.get(slowKey) || 0) + 1);
                        console.warn(`Slow question generation (${duration.toFixed(2)}ms): ${type} for grade ${grade}`);
                    }
    
                } catch (error) {
                    results.failedQuestions++;
                    const errorKey = `${grade}-${type || 'Unknown'}`;
                    results.errorsByGradeAndType.set(errorKey, (results.errorsByGradeAndType.get(errorKey) || 0) + 1);
                    console.error(`Error generating question for grade ${grade}, type ${type || 'Unknown'}:`, error);
                }
    
                if ((i + 1) % 100 === 0) {
                    console.log(`Progress: ${i + 1}/${questionsPerGrade} questions for grade ${grade}`);
                }
            }
        }
    
        this.displayResults(results);
    }
    

    static validateQuestion(question) {
        if (!question) {
            console.error('Validation failed: Question is null or undefined');
            return false;
        }
        if (typeof question.questionText !== 'string') {
            console.error('Validation failed: questionText is not a string', question);
            return false;
        }
        if (question.correctAnswer === undefined || question.correctAnswer === null) {
            console.error('Validation failed: correctAnswer is missing or null', question);
            return false;
        }
        if (!Array.isArray(question.wrongAnswers) || question.wrongAnswers.length === 0) {
            console.error('Validation failed: wrongAnswers is invalid', question);
            return false;
        }
        if (typeof question.feedback !== 'string') {
            console.error('Validation failed: feedback is not a string', question);
            return false;
        }
        return true;
    }
    
    

    static displayResults(results) {
        console.log('\n=== QuestionFactory Stress Test Results ===');
        console.log(`Total questions attempted: ${results.totalQuestions}`);
        console.log(`Successful generations: ${results.successfulQuestions} (${((results.successfulQuestions/results.totalQuestions)*100).toFixed(2)}%)`);
        console.log(`Failed generations: ${results.failedQuestions} (${((results.failedQuestions/results.totalQuestions)*100).toFixed(2)}%)`);
        console.log(`Slow generations: ${results.slowQuestions} (${((results.slowQuestions/results.totalQuestions)*100).toFixed(2)}%)`);

        console.log('\n=== Question Type Distribution ===');
        for (const [type, count] of results.typeFrequency) {
            const avgTimes = results.averageTimeByType.get(type);
            const avgTime = avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length;
            console.log(`${type}:`);
            console.log(`  Count: ${count} (${((count/results.totalQuestions)*100).toFixed(2)}%)`);
            console.log(`  Average generation time: ${avgTime.toFixed(2)}ms`);
            if (results.slowByType.has(type)) {
                console.log(`  Slow generations: ${results.slowByType.get(type)}`);
            }
        }

        console.log('\n=== Error Distribution ===');
        for (const [errorType, count] of results.errorsByType) {
            console.log(`${errorType}: ${count} occurrences`);
        }
    }
}

// Add these debug lines before export
console.log('Defining QuestionFactory');
console.log('Methods:', Object.getOwnPropertyNames(QuestionFactory));

export default QuestionFactory;