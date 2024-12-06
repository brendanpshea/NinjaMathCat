class QuestionTest {
    static runStressTests(iterations = 10000) {
        console.log(`Starting stress test with ${iterations} iterations...`);

        const questionTypes = [
            Addition,
            Subtraction,
            CountingObjects,
            NumberSequence,
            SkipCounting,
            WordProblem,
            ShapeIdentification,
            ComparisonQuestion,
            PatternRecognition,
            MoneyCounting,
        ];

        for (let i = 0; i < iterations; i++) {
            try {
                const grade = this.getRandomGrade();
                const QuestionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
                const startTime = performance.now();

                console.log(`Selected question type: ${QuestionType.name}`);
                const question = new QuestionType(grade).generate();
                console.log(question.questionText);
                const elapsedTime = performance.now() - startTime;

                if (elapsedTime > 500) {
                    // Log slow question generation
                    console.error(`Slow question generation detected: ${elapsedTime}ms`);
                    this.logProblematicQuestion(question, elapsedTime);
                }

            } catch (error) {
                // Log error details and question type causing the issue
                console.error("Error encountered during question generation!");
                console.error("Error Details:", error);
                console.error("Failed Question Type:", QuestionType.name);
            }

            if (i % 1000 === 0 && i > 0) {
                console.log(`Completed ${i} iterations...`);
            }
        }

        console.log("Stress test completed.");
    }

    static getRandomGrade() {
        // Simulate a random grade between Kindergarten (0.0) and Grade 2 (2.0)
        return Math.random() * 2;
    }

    static logProblematicQuestion(question, elapsedTime) {
        console.error("Problematic Question Details:");
        console.error("Question Text:", question.questionText || "N/A");
        console.error("Correct Answer:", question.correctAnswer || "N/A");
        console.error("Wrong Answers:", question.wrongAnswers || "N/A");
        console.error("Difficulty:", question.difficulty || "N/A");
        console.error("Elapsed Time:", elapsedTime, "ms");
    }
}

// Utils class for random and shuffle, required for testing
class Utils {
    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Run the stress test
QuestionTest.runStressTests();
