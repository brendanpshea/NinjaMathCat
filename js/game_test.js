class GameTest {
    static runStressTests(iterations = 1000) {
        console.log(`Starting stress test for the game with ${iterations} iterations...`);

        // Create a game instance
        const game = new Game();

        for (let i = 0; i < iterations; i++) {
            try {
                // Simulate a random grade
                const grade = this.getRandomGrade();
                game.grade = grade;

                // Start a battle and generate a question
                game.startBattle();

                // Simulate answering all questions in the battle
                for (let j = 0; j < game.maxQuestions; j++) {
                    const startTime = performance.now();
                    game.generateQuestion();
                    const elapsedTime = performance.now() - startTime;

                    if (elapsedTime > 500) {
                        // Log slow question generation
                        console.error(
                            `Slow question generation detected (${elapsedTime}ms):`,
                            game.currentQuestion
                        );
                    }

                    // Simulate an answer (randomly choosing correct or incorrect)
                    const isCorrect = Math.random() > 0.5;
                    const answer = isCorrect
                        ? game.currentQuestion.correctAnswer
                        : game.currentQuestion.wrongAnswers[0];

                    game.handleAnswer(answer);

                    // Check for potential infinite loop
                    if (performance.now() - startTime > 1000) {
                        console.error(
                            "Potential infinite loop detected during question handling:",
                            game.currentQuestion
                        );
                        break;
                    }
                }

                // End battle and restart game
                game.endBattle("Test Completed");
                game.restartGame();

                // Periodic log to track progress
                if (i % 100 === 0 && i > 0) {
                    console.log(`Completed ${i} iterations.`);
                }
            } catch (error) {
                console.error("Error during game simulation:", error);
                console.error("Game state at error:", {
                    grade: game.grade,
                    currentQuestion: game.currentQuestion,
                    questionCount: game.questionCount,
                });
            }
        }

        console.log("Stress test completed.");
    }

    static getRandomGrade() {
        // Simulate a random grade between Kindergarten (0.0) and Grade 2 (2.0)
        return Math.random() * 2;
    }
}

// Run the stress test
document.addEventListener("DOMContentLoaded", () => {
    console.log("Starting game stress tests...");
    GameTest.runStressTests(1000); // Adjust the iteration count as needed
});
