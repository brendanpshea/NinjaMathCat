// time_question.js
// Description: Simplified version that drops AM/PM and time zone problems

import { NumericalQuestion, QuestUtils as Utils } from "./base_question.js";

class TimeQuestion extends NumericalQuestion {
    constructor(grade) {
        super(grade);

        this.hourClocks = [
            '🕐', '🕑', '🕒', '🕓', '🕔', '🕕',
            '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'
        ];
        
        this.halfHourClocks = [
            '🕜', '🕝', '🕞', '🕟', '🕠', '🕡',
            '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'
        ];

        this.dailySchedule = [
            { event: 'wake up', time: '7:00 AM', period: 'morning' },
            { event: 'eat breakfast', time: '7:30 AM', duration: 20, period: 'morning' },
            { event: 'start school', time: '8:15 AM', period: 'morning' },
            { event: 'morning recess', time: '10:30 AM', duration: 15, period: 'morning' },
            { event: 'lunch', time: '12:00 PM', duration: 45, period: 'afternoon' },
            { event: 'end school', time: '3:00 PM', period: 'afternoon' },
            { event: 'sports practice', time: '4:00 PM', duration: 90, period: 'afternoon' },
            { event: 'dinner', time: '6:30 PM', duration: 30, period: 'evening' },
            { event: 'homework', time: '7:15 PM', duration: 45, period: 'evening' },
            { event: 'bedtime', time: '8:30 PM', period: 'evening' }
        ];

        this.timeIntervals = [15, 30, 45, 60, 90, 120];
    }

    getClockEmoji(hour, minutes) {
        const index = hour - 1; // Convert 1-12 to 0-11
        return minutes === 30 ? this.halfHourClocks[index] : this.hourClocks[index];
    }

    parseTime(timeStr) {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        return {
            hours: period === 'PM' && hours !== 12 ? hours + 12 : (period === 'AM' && hours === 12 ? 0 : hours),
            minutes
        };
    }

    formatTime(hours, minutes) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    calculateElapsedTime(startTime, endTime) {
        let startMinutes = startTime.hours * 60 + startTime.minutes;
        let endMinutes = endTime.hours * 60 + endTime.minutes;
        
        if (endMinutes < startMinutes) {
            endMinutes += 24 * 60; // Add 24 hours if crossing midnight
        }
        
        const elapsedMinutes = endMinutes - startMinutes;
        const hours = Math.floor(elapsedMinutes / 60);
        const mins = elapsedMinutes % 60;
        
        return { hours, minutes: mins };
    }

    // Format elapsed time into a natural language string
    formatElapsed(hours, minutes) {
        if (hours > 0 && minutes > 0) {
            return `${hours} hours and ${minutes} minutes`;
        } else if (hours > 0 && minutes === 0) {
            return `${hours} hours`;
        } else if (hours === 0 && minutes > 0) {
            return `${minutes} minutes`;
        } else {
            return `0 minutes`;
        }
    }

    generateClockReading() {
        const hour = Utils.random(1, 12);
        const isHalfHour = this.grade > 0.5 && Utils.random(0, 1) === 1;
        const clockEmoji = this.getClockEmoji(hour, isHalfHour ? 30 : 0);
        
        this.questionText = `${clockEmoji} What time is shown on this clock?`;
        this.correctAnswer = `${hour}:${isHalfHour ? '30' : '00'}`;
        this.wrongAnswers = [
            `${hour}:${isHalfHour ? '00' : '30'}`,
            `${(hour % 12) + 1}:${isHalfHour ? '30' : '00'}`,
            `${((hour + 2) % 12) || 12}:${isHalfHour ? '30' : '00'}`
        ];
        this.feedback = isHalfHour ? 
            "Look carefully at where the minute hand points." :
            "Look at the hour hand's position closely.";
    }

    generateScheduleQuestion() {
        const firstIndex = Utils.random(0, this.dailySchedule.length - 2);
        const firstEvent = this.dailySchedule[firstIndex];
        const secondEvent = this.dailySchedule[firstIndex + 1];

        const startTime = this.parseTime(firstEvent.time);
        const endTime = this.parseTime(secondEvent.time);
        const elapsed = this.calculateElapsedTime(startTime, endTime);

        const elapsedStr = this.formatElapsed(elapsed.hours, elapsed.minutes);
        
        this.questionText = `If ${firstEvent.event} is at ${firstEvent.time} and ${secondEvent.event} is at ${secondEvent.time}, how much time passes in between?`;
        
        this.correctAnswer = elapsedStr;
        this.wrongAnswers = [
            this.formatElapsed(elapsed.hours + 1, elapsed.minutes),
            this.formatElapsed(elapsed.hours, (elapsed.minutes + 15) % 60),
            this.formatElapsed(Math.max(0, elapsed.hours - 1), elapsed.minutes + 30)
        ];
        this.feedback = "Calculate the time difference between the two events.";
    }

    generateMultiStepProblem() {
        const startIndex = Utils.random(0, this.dailySchedule.length - 3);
        const events = this.dailySchedule.slice(startIndex, startIndex + 3);
        const waitTime = this.timeIntervals[Utils.random(0, this.timeIntervals.length - 1)];

        const arrivalTime = this.parseTime(events[0].time);
        let adjustedArrivalMinutes = arrivalTime.hours * 60 + arrivalTime.minutes - waitTime;
        if (adjustedArrivalMinutes < 0) {
            adjustedArrivalMinutes += 24 * 60;
        }
        const arrivalHours = Math.floor(adjustedArrivalMinutes / 60) % 24;
        const arrivalMins = adjustedArrivalMinutes % 60;
        const arrivalParsed = { hours: arrivalHours, minutes: arrivalMins };

        const finalTime = this.parseTime(events[2].time);
        const totalTime = this.calculateElapsedTime(arrivalParsed, finalTime);
        const totalStr = this.formatElapsed(totalTime.hours, totalTime.minutes);

        const scenario = `You arrive ${waitTime} minutes before ${events[0].event} (at ${events[0].time}), then go to ${events[1].event} (at ${events[1].time}), and finally to ${events[2].event} (at ${events[2].time}).`;
        
        this.questionText = `${scenario}\nHow long is your entire schedule, from arrival to the end?`;
        
        this.correctAnswer = totalStr;
        this.wrongAnswers = [
            this.formatElapsed(totalTime.hours + 1, totalTime.minutes),
            this.formatElapsed(Math.max(0, totalTime.hours - 1), (totalTime.minutes + 30) % 60),
            this.formatElapsed(totalTime.hours, (totalTime.minutes + 15) % 60)
        ];
        this.feedback = "Calculate your arrival time and then find the total time until the last event.";
    }

    generate() {
        // Simplified: No AM/PM or time zone questions.
        // For grade <= 1.0: clock reading only.
        // For grade <= 2.0: alternate between clock reading and schedule question.
        // For grade > 2.0: alternate between schedule question and multi-step problem.

        if (this.grade <= 1.0) {
            this.generateClockReading();
        } else if (this.grade <= 2.0) {
            const type = Utils.random(0, 1);
            if (type === 0) {
                this.generateClockReading();
            } else {
                this.generateScheduleQuestion();
            }
        } else {
            const type = Utils.random(0, 1);
            if (type === 0) {
                this.generateScheduleQuestion();
            } else {
                this.generateMultiStepProblem();
            }
        }

        return this;
    }
}

export { TimeQuestion };
