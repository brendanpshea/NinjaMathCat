import { NumericalQuestion, QuestUtils as Utils } from "./base_question.js";

class TimeQuestion extends NumericalQuestion {
    constructor(grade) {
        super(grade);
        
        this.activities = [
            "The movie",
            "Soccer practice",
            "The birthday party",
            "The school assembly",
            "Dance class",
            "Swimming lessons",
            "Band practice",
            "Art class",
            "The nature hike",
            "Basketball training",
            "Piano lessons",
            "The science experiment"
        ];

        // Minutes for fixed duration activities
        this.durations = [30, 45, 60, 90, 120];
    }

    getRandomItem(array) {
        return array[Utils.random(0, array.length - 1)];
    }

    roundToGradeLevel(minutes) {
        if (this.grade <= 1.0) {
            return Math.round(minutes / 60) * 60;  // Round to hours
        } else if (this.grade <= 1.5) {
            return Math.round(minutes / 30) * 30;  // Round to half hours
        } else if (this.grade <= 2.0) {
            return Math.round(minutes / 15) * 15;  // Round to quarter hours
        } else if (this.grade <= 2.5) {
            return Math.round(minutes / 5) * 5;    // Round to 5 minutes
        }
        return minutes;  // Grade 3.0: any minute value
    }

    formatTime(totalMinutes) {
        let hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        
        // Convert to 12-hour format
        hours = hours % 12;
        if (hours === 0) hours = 12;
        
        return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours === 0) {
            return `${remainingMinutes} minutes`;
        } else if (remainingMinutes === 0) {
            return hours === 1 ? "1 hour" : `${hours} hours`;
        } else {
            return `${hours} hour${hours > 1 ? 's' : ''} and ${remainingMinutes} minutes`;
        }
    }

    generateStartEndQuestion() {
        const activity = this.getRandomItem(this.activities);
        
        // Generate start time (in minutes since midnight)
        const startHour = Utils.random(8, 19);  // Between 8 AM and 7 PM
        const baseStartMinutes = startHour * 60 + Utils.random(0, 59);
        const startMinutes = this.roundToGradeLevel(baseStartMinutes);
        
        // Generate duration (30min - 3hrs)
        const baseDuration = Utils.random(30, 180);
        const duration = this.roundToGradeLevel(baseDuration);
        
        const endMinutes = startMinutes + duration;
        
        this.questionText = `${activity} starts at ${this.formatTime(startMinutes)} and ends at ${this.formatTime(endMinutes)}. How long did it take?`;
        
        this.correctAnswer = this.formatDuration(duration);
        
        // Generate wrong answers with reasonable variations
        this.wrongAnswers = [
            this.formatDuration(duration + 30),
            this.formatDuration(Math.max(30, duration - 30)),
            this.formatDuration(duration + 15)
        ];
        
        this.feedback = "To find the duration, subtract the start time from the end time.";
    }

    generateDurationQuestion() {
        const activity = this.getRandomItem(this.activities);
        const startHour = Utils.random(8, 19);
        const baseStartMinutes = startHour * 60 + Utils.random(0, 59);
        const startMinutes = this.roundToGradeLevel(baseStartMinutes);
        
        const duration = this.roundToGradeLevel(this.getRandomItem(this.durations));
        
        this.questionText = `${activity} starts at ${this.formatTime(startMinutes)} and goes for ${this.formatDuration(duration)}. When does it end?`;
        
        const endMinutes = startMinutes + duration;
        this.correctAnswer = this.formatTime(endMinutes);
        
        // Generate wrong answers with common mistakes
        this.wrongAnswers = [
            this.formatTime(endMinutes + 30),
            this.formatTime(endMinutes - 30),
            this.formatTime(endMinutes + 15)
        ];
        
        this.feedback = "Add the duration to the start time to find the end time.";
    }

    generate() {
        // Randomly choose between the two question types
        if (Utils.random(0, 1) === 0) {
            this.generateStartEndQuestion();
        } else {
            this.generateDurationQuestion();
        }
        
        return this;
    }
}

export { TimeQuestion };