// time_question.js
// Description: Generates comprehensive time questions with clear notation

import { NumericalQuestion, QuestUtils as Utils } from "./base_question.js";

class TimeQuestion extends NumericalQuestion {
    constructor(grade) {
        super(grade);

        // Hour clock emojis (1:00-12:00)
        this.hourClocks = [
            '🕐', '🕑', '🕒', '🕓', '🕔', '🕕',
            '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'
        ];
        
        // Half-hour clock emojis (1:30-12:30)
        this.halfHourClocks = [
            '🕜', '🕝', '🕞', '🕟', '🕠', '🕡',
            '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'
        ];

        // Daily schedule with AM/PM times and durations
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

        // Time intervals for schedule-based problems
        this.timeIntervals = [15, 30, 45, 60, 90, 120];

        // Bind methods to ensure proper `this` context
        this.getClockEmoji = this.getClockEmoji.bind(this);
    }

    getClockEmoji(hour, minutes) {
        const index = hour - 1; // Convert 1-12 to 0-11
        return minutes === 30 ? this.halfHourClocks[index] : this.hourClocks[index];
    }

    // Helper function to parse time string with AM/PM
    parseTime(timeStr) {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        return {
            hours: period === 'PM' && hours !== 12 ? hours + 12 : hours,
            minutes,
            period
        };
    }

    // Helper function to format time with AM/PM
    formatTime(hours, minutes, includePeriod = true) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')}`;
        return includePeriod ? `${timeStr} ${period}` : timeStr;
    }

    // Calculate elapsed time between two times
    calculateElapsedTime(startTime, endTime) {
        let startMinutes = startTime.hours * 60 + startTime.minutes;
        let endMinutes = endTime.hours * 60 + endTime.minutes;
        
        if (endMinutes < startMinutes) {
            endMinutes += 24 * 60; // Add 24 hours if crossing midnight
        }
        
        const elapsedMinutes = endMinutes - startMinutes;
        const hours = Math.floor(elapsedMinutes / 60);
        const minutes = elapsedMinutes % 60;
        
        return { hours, minutes };
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
            `${(hour + 2) % 12 || 12}:${isHalfHour ? '30' : '00'}`
        ];
        this.feedback = isHalfHour ? 
            "Look at both the hour and minute hands on the clock." :
            "Look at the number the hour hand points to.";
    }

    generateAMPMQuestion() {
        // Select two events from different periods
        const event = Utils.random(0, this.dailySchedule.length - 1);
        const currentEvent = this.dailySchedule[event];

        this.questionText = `What time period (AM or PM) is ${currentEvent.time}?`;
        this.correctAnswer = currentEvent.time.split(' ')[1];
        this.wrongAnswers = [
            currentEvent.time.split(' ')[1] === 'AM' ? 'PM' : 'AM',
            'noon',
            'midnight'
        ];
        this.feedback = `Think about whether ${currentEvent.event} happens before or after noon.`;
    }

    generateScheduleQuestion() {
        // Pick two related events from the schedule
        const firstIndex = Utils.random(0, this.dailySchedule.length - 2);
        const firstEvent = this.dailySchedule[firstIndex];
        const secondEvent = this.dailySchedule[firstIndex + 1];

        const startTime = this.parseTime(firstEvent.time);
        const endTime = this.parseTime(secondEvent.time);
        const elapsed = this.calculateElapsedTime(startTime, endTime);

        this.questionText = `If ${firstEvent.event} is at ${firstEvent.time} and ${secondEvent.event} ` +
            `is at ${secondEvent.time}, how much time is in between?`;
        
        const elapsedStr = elapsed.minutes > 0 ? 
            `${elapsed.hours} hours and ${elapsed.minutes} minutes` :
            `${elapsed.hours} hours`;
            
        this.correctAnswer = elapsedStr;
        this.wrongAnswers = [
            `${elapsed.hours + 1} hours`,
            `${elapsed.hours} hours and ${(elapsed.minutes + 15) % 60} minutes`,
            `${elapsed.hours - 1} hours and ${elapsed.minutes + 30} minutes`
        ];
        this.feedback = "Find the difference between the two times, considering AM and PM.";
    }

    generateMultiStepProblem() {
        // Create a sequence of 2-3 events with waiting times
        const startIndex = Utils.random(0, this.dailySchedule.length - 3);
        const events = this.dailySchedule.slice(startIndex, startIndex + 3);
        const waitTime = this.timeIntervals[Utils.random(0, this.timeIntervals.length - 1)];

        const scenario = `You arrive ${waitTime} minutes before ${events[0].event} ` +
            `(which starts at ${events[0].time}). After that, you go to ${events[1].event} ` +
            `(at ${events[1].time}), and then to ${events[2].event} (at ${events[2].time}).`;

        // Calculate total time
        const arrivalTime = this.parseTime(events[0].time);
        arrivalTime.minutes -= waitTime;
        if (arrivalTime.minutes < 0) {
            arrivalTime.hours--;
            arrivalTime.minutes += 60;
        }
        
        const finalTime = this.parseTime(events[2].time);
        const totalTime = this.calculateElapsedTime(arrivalTime, finalTime);

        this.questionText = `${scenario}\nHow long is your entire schedule, from arrival to the end?`;
        
        const totalStr = totalTime.minutes > 0 ?
            `${totalTime.hours} hours and ${totalTime.minutes} minutes` :
            `${totalTime.hours} hours`;
            
        this.correctAnswer = totalStr;
        this.wrongAnswers = [
            `${totalTime.hours + 1} hours`,
            `${totalTime.hours - 1} hours and ${totalTime.minutes + 30} minutes`,
            `${totalTime.hours} hours and ${(totalTime.minutes + 15) % 60} minutes`
        ];
        this.feedback = "Break down the problem: calculate arrival time, then find total elapsed time.";
    }

    generateTimeZoneProblem() {
        // Only for higher grades (3.0+)
        const timeZones = [
            { name: 'New York', offset: 0 },
            { name: 'Chicago', offset: -1 },
            { name: 'Denver', offset: -2 },
            { name: 'Los Angeles', offset: -3 }
        ];

        const baseTime = Utils.random(1, 12);
        const minutes = Utils.random(0, 1) * 30;
        const period = Utils.random(0, 1) ? 'AM' : 'PM';
        const fromZone = timeZones[Utils.random(0, timeZones.length - 1)];
        const toZone = timeZones[Utils.random(0, timeZones.length - 1)];

        if (fromZone === toZone) return this.generateMultiStepProblem(); // Fallback if same zone

        const timeStr = `${baseTime}:${minutes.toString().padStart(2, '0')} ${period}`;
        this.questionText = `If it's ${timeStr} in ${fromZone.name}, what time is it in ${toZone.name}?`;

        // Calculate time difference
        let newHours = baseTime + (fromZone.offset - toZone.offset);
        let newPeriod = period;
        
        if (newHours <= 0) {
            newHours += 12;
            newPeriod = period === 'AM' ? 'PM' : 'AM';
        } else if (newHours > 12) {
            newHours -= 12;
            newPeriod = period === 'AM' ? 'PM' : 'AM';
        }

        this.correctAnswer = `${newHours}:${minutes.toString().padStart(2, '0')} ${newPeriod}`;
        
        // Generate wrong answers with common mistakes
        this.wrongAnswers = [
            `${newHours}:${minutes.toString().padStart(2, '0')} ${period}`,
            `${baseTime}:${minutes.toString().padStart(2, '0')} ${newPeriod}`,
            `${(newHours % 12) + 1}:${minutes.toString().padStart(2, '0')} ${newPeriod}`
        ];
        this.feedback = "Remember that time moves backward as you go west across time zones.";
    }

    generate() {
        // Determine problem type based on grade level
        if (this.grade <= 1.0) {
            // K-1: Clock reading and simple AM/PM
            const type = Utils.random(0, 1);
            if (type === 0) {
                this.generateClockReading();  // Remove super.
            } else {
                this.generateAMPMQuestion();
            }
        } 
        else if (this.grade <= 2.0) {
            // Grade 2: Add schedule problems
            const type = Utils.random(0, 2);
            if (type === 0) {
                this.generateAMPMQuestion();
            } else if (type === 1) {
                this.generateScheduleQuestion();
            } else {
                this.generateClockReading();  // Replace with existing method
            }
        }
        else {
            // Grade 3+: All problem types
            const type = Utils.random(0, 3);
            if (type === 0) {
                this.generateScheduleQuestion();
            } else if (type === 1) {
                this.generateMultiStepProblem();
            } else if (type === 2) {
                this.generateTimeZoneProblem();
            } else {
                this.generateScheduleQuestion(); // Replace with existing method
            }
        }
    
        // Return this for chaining
        return this;
    }
}

export { TimeQuestion };