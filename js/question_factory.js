// question_factory.js
// Description: Factory class for generating random questions based on grade level.

// import all question types
import { CountingObjects, Addition, Subtraction, PatternRecognition, MoneyCounting, NumberSequence, ComparisonQuestion, SkipCounting } from "./question_types.js";
import { WordProbAdd, WordProbMult, WordProbSub, WordProbDiv } from "./word_problem.js";

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

export default QuestionFactory;