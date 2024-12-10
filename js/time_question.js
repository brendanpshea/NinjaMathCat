// time_question.js
// Description: Class for generating time-related questions.

import {Question} from './base_question.js';

class TimeQuestion extends Question {
    constructor(grade) {
        super(grade);
        this.clockEmoji = "🕐"; // Default clock emoji
        this.hourEmojis = {
            1: "🕐", 2: "🕑", 3: "🕒", 4: "🕓", 5: "🕔", 
            6: "🕕", 7: "🕖", 8: "🕗", 9: "🕘", 10: "🕙",
            11: "🕚", 12: "🕛"
        };
        this.halfHourEmojis = {
            1: "🕜", 2: "🕝", 3: "🕞", 4: "🕟", 5: "🕠",
            6: "🕡", 7: "🕢", 8: "🕣", 9: "🕤", 10: "🕥",
            11: "🕦", 12: "🕧"
        };
    }

    generate() {
        if (this.grade <= 0.5) {
            return this.generateKindergarten();
        } else if (this.grade <= 1.0) {
            return this.generateFirstGrade();
        } else if (this.grade <= 1.5) {
            return this.generateMidFirstGrade();
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
     * Focus: Hours only, digital time recognition
     */
    generateKindergarten() {
        const hour = Utils.random(1, 12);
        const questionTypes = [
            () => ({
                text: `What time is shown? ${this.hourEmojis[hour]}`,
                answer: `${hour}:00`,
                wrongs: [
                    `${(hour % 12) + 1}:00`,
                    `${hour === 1 ? 12 : hour - 1}:00`,
                    `${hour}:30`
                ],
                feedback: "Look at where the big hand points for the hour."
            }),
            () => ({
                text: `What time is it when the hour hand points to ${hour}? ${this.hourEmojis[hour]}`,
                answer: `${hour} o'clock`,
                wrongs: [
                    `${(hour % 12) + 1} o'clock`,
                    `${hour === 1 ? 12 : hour - 1} o'clock`,
                    `half past ${hour}`
                ],
                feedback: "When we say the hour, we say 'o'clock'."
            })
        ];

        const question = questionTypes[Utils.random(0, questionTypes.length - 1)]();
        this.questionText = question.text;
        this.correctAnswer = question.answer;
        this.wrongAnswers = question.wrongs;
        this.feedback = question.feedback;

        return this;
    }

    /**
     * First Grade (Grade 1.0)
     * Focus: Hours and half hours
     */
    generateFirstGrade() {
        const hour = Utils.random(1, 12);
        const isHalfHour = Utils.random(0, 1) === 1;

        if (isHalfHour) {
            this.questionText = `What time is shown? ${this.halfHourEmojis[hour]}`;
            this.correctAnswer = `${hour}:30`;
            this.wrongAnswers = [
                `${hour}:00`,
                `${(hour % 12) + 1}:30`,
                `${hour === 1 ? 12 : hour - 1}:30`
            ];
            this.feedback = "When the minute hand points to 6, it's half past the hour.";
        } else {
            this.questionText = `What time is shown? ${this.hourEmojis[hour]}`;
            this.correctAnswer = `${hour}:00`;
            this.wrongAnswers = [
                `${hour}:30`,
                `${(hour % 12) + 1}:00`,
                `${hour === 1 ? 12 : hour - 1}:00`
            ];
            this.feedback = "When both hands point to a number, it's exactly that hour.";
        }

        return this;
    }

    /**
     * Mid-First Grade (Grade 1.5)
     * Focus: Quarter hours, introduction to "quarter past" terminology
     */
    generateMidFirstGrade() {
        const hour = Utils.random(1, 12);
        const quarterType = Utils.random(0, 2); // 0: o'clock, 1: quarter past, 2: half past

        switch (quarterType) {
            case 0:
                this.questionText = `What time is it? ${this.hourEmojis[hour]}`;
                this.correctAnswer = `${hour} o'clock`;
                this.wrongAnswers = [
                    `quarter past ${hour}`,
                    `half past ${hour}`,
                    `quarter to ${(hour % 12) + 1}`
                ];
                this.feedback = "When both hands point to the number, it's o'clock.";
                break;
            case 1:
                this.questionText = `When the minute hand points to 3, what time is it after ${hour} o'clock?`;
                this.correctAnswer = `quarter past ${hour}`;
                this.wrongAnswers = [
                    `${hour} o'clock`,
                    `half past ${hour}`,
                    `quarter to ${hour}`
                ];
                this.feedback = "When the minute hand points to 3, it's quarter past the hour.";
                break;
            case 2:
                this.questionText = `What time is shown? ${this.halfHourEmojis[hour]}`;
                this.correctAnswer = `half past ${hour}`;
                this.wrongAnswers = [
                    `quarter past ${hour}`,
                    `${hour} o'clock`,
                    `quarter to ${(hour % 12) + 1}`
                ];
                this.feedback = "When the minute hand points to 6, it's half past the hour.";
                break;
        }

        return this;
    }

    /**
     * Second Grade (Grade 2.0)
     * Focus: Quarter to, five-minute intervals
     */
    generateSecondGrade() {
        const hour = Utils.random(1, 12);
        const questionTypes = [
            this.generateQuarterToQuestion.bind(this),
            this.generateFiveMinuteQuestion.bind(this)
        ];
        return questionTypes[Utils.random(0, questionTypes.length - 1)](hour);
    }

    generateQuarterToQuestion(hour) {
        const nextHour = (hour % 12) + 1;
        this.questionText = `When the minute hand points to 9, what time is it before ${nextHour} o'clock?`;
        this.correctAnswer = `quarter to ${nextHour}`;
        this.wrongAnswers = [
            `quarter past ${hour}`,
            `quarter to ${hour}`,
            `${nextHour} o'clock`
        ];
        this.feedback = "When the minute hand points to 9, it's quarter to the next hour.";
        return this;
    }

    generateFiveMinuteQuestion(hour) {
        const minutes = Utils.random(1, 11) * 5;
        this.questionText = `When the minute hand points to ${minutes / 5}, what time is it after ${hour} o'clock?`;
        this.correctAnswer = `${hour}:${minutes.toString().padStart(2, '0')}`;
        this.wrongAnswers = [
            `${hour}:${((minutes + 5) % 60).toString().padStart(2, '0')}`,
            `${hour}:${((minutes - 5 + 60) % 60).toString().padStart(2, '0')}`,
            `${(hour % 12) + 1}:${minutes.toString().padStart(2, '0')}`
        ];
        this.feedback = "Count by 5s as you move around the clock face.";
        return this;
    }

    /**
     * Mid-Second Grade (Grade 2.5)
     * Focus: Time intervals, elapsed time
     */
    generateMidSecondGrade() {
        const questionTypes = [
            this.generateSimpleElapsedTime.bind(this),
            this.generateTimeIntervalWord.bind(this)
        ];
        return questionTypes[Utils.random(0, questionTypes.length - 1)]();
    }

    generateSimpleElapsedTime() {
        const startHour = Utils.random(1, 11);
        const endHour = startHour + Utils.random(1, 3);
        
        this.questionText = `If an activity starts at ${startHour}:00 and ends at ${endHour}:00, how long does it last?`;
        this.correctAnswer = `${endHour - startHour} hours`;
        this.wrongAnswers = [
            `${endHour - startHour + 1} hours`,
            `${endHour - startHour - 1} hours`,
            `${endHour} hours`
        ];
        this.feedback = "Count the hours from start to end time.";
        return this;
    }

    generateTimeIntervalWord() {
        const hour = Utils.random(1, 12);
        const minutes = Utils.random(1, 11) * 5;
        const interval = Utils.random(1, 4) * 15;
        
        this.questionText = `If your dance class starts at ${hour}:${minutes.toString().padStart(2, '0')} ` +
            `and lasts ${interval} minutes, what time does it end?`;
        
        const endMinutes = (minutes + interval) % 60;
        const endHour = hour + Math.floor((minutes + interval) / 60);
        this.correctAnswer = `${endHour}:${endMinutes.toString().padStart(2, '0')}`;
        
        this.wrongAnswers = [
            `${hour}:${(minutes + interval).toString().padStart(2, '0')}`,
            `${endHour}:${minutes.toString().padStart(2, '0')}`,
            `${hour + 1}:${endMinutes.toString().padStart(2, '0')}`
        ];
        this.feedback = "Add the minutes first, then adjust the hour if needed.";
        return this;
    }

    /**
     * Third Grade (Grade 3.0)
     * Focus: Complex elapsed time, AM/PM, time word problems
     */
    generateThirdGrade() {
        const questionTypes = [
            this.generateComplexElapsedTime.bind(this),
            this.generateAMPMQuestion.bind(this),
            this.generateTimeWordProblem.bind(this)
        ];
        return questionTypes[Utils.random(0, questionTypes.length - 1)]();
    }

    generateComplexElapsedTime() {
        const startHour = Utils.random(1, 11);
        const startMinutes = Utils.random(0, 11) * 5;
        const durationHours = Utils.random(1, 3);
        const durationMinutes = Utils.random(1, 11) * 5;
        
        this.questionText = `If an event starts at ${startHour}:${startMinutes.toString().padStart(2, '0')} ` +
            `and lasts ${durationHours} hours and ${durationMinutes} minutes, what time does it end?`;
        
        const totalMinutes = startMinutes + durationMinutes;
        const endHour = startHour + durationHours + Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        
        this.correctAnswer = `${endHour}:${endMinutes.toString().padStart(2, '0')}`;
        this.wrongAnswers = [
            `${startHour + durationHours}:${startMinutes.toString().padStart(2, '0')}`,
            `${endHour - 1}:${endMinutes.toString().padStart(2, '0')}`,
            `${endHour}:${(endMinutes + 5).toString().padStart(2, '0')}`
        ];
        this.feedback = "Add hours and minutes separately, then combine them.";
        return this;
    }

    generateAMPMQuestion() {
        const hour = Utils.random(1, 12);
        const isAM = Utils.random(0, 1) === 0;
        const activities = {
            AM: ['breakfast', 'morning walk', 'school start'],
            PM: ['dinner', 'sunset', 'bedtime story']
        };
        const activity = activities[isAM ? 'AM' : 'PM'][Utils.random(0, 2)];
        
        this.questionText = `If ${activity} is at ${hour}:00 ${isAM ? 'AM' : 'PM'}, ` +
            `what time will it be 3 hours later?`;
        
        const endHour = ((hour + 3 - 1) % 12) + 1;
        const endPeriod = (hour + 3) > 12 ? (isAM ? 'PM' : 'AM') : (isAM ? 'AM' : 'PM');
        
        this.correctAnswer = `${endHour}:00 ${endPeriod}`;
        this.wrongAnswers = [
            `${endHour}:00 ${isAM ? 'AM' : 'PM'}`,
            `${hour + 3}:00 ${isAM ? 'AM' : 'PM'}`,
            `${endHour}:30 ${endPeriod}`
        ];
        this.feedback = "Remember to change from AM to PM when crossing 12 o'clock.";
        return this;
    }
    generateTimeWordProblem() {
        const scenarios = [
            {
                template: (start, duration) => 
                    `A movie starts at ${start} and is ${duration} minutes long. What time does it end?`,
                startHour: Utils.random(1, 8),
                duration: Utils.random(2, 4) * 30
            },
            {
                template: (start, end) => 
                    `A train ride starts at ${start} and ends at ${end}. How long is the ride?`,
                startHour: Utils.random(8, 11),
                endHour: Utils.random(1, 3)
            }
        ];

        const scenario = scenarios[Utils.random(0, scenarios.length - 1)];
        
        if ('duration' in scenario) {
            const startTime = `${scenario.startHour}:00`;
            const endHour = scenario.startHour + Math.floor(scenario.duration / 60);
            const endMinutes = scenario.duration % 60;
            const endTime = `${endHour}:${endMinutes.toString().padStart(2, '0')}`;
            
            this.questionText = scenario.template(startTime, scenario.duration);
            this.correctAnswer = endTime;
            this.wrongAnswers = [
                `${endHour - 1}:${endMinutes.toString().padStart(2, '0')}`,
                `${endHour}:${((endMinutes + 15) % 60).toString().padStart(2, '0')}`,
                `${endHour + 1}:${endMinutes.toString().padStart(2, '0')}`
            ];
            this.feedback = "Add the hours and minutes separately, then combine.";
        } else {
            const startTime = `${scenario.startHour}:00`;
            const endTime = `${scenario.endHour}:00`;
            const duration = ((scenario.endHour + 12 - scenario.startHour) % 12) || 12;
            
            this.questionText = scenario.template(startTime, endTime);
            this.correctAnswer = `${duration} hours`;
            this.wrongAnswers = [
                `${duration + 1} hours`,
                `${duration - 1} hours`,
                `${(duration + 2) % 12 || 12} hours`
            ];
            this.feedback = "Count the hours between start and end time.";
        }
        
        return this;
    }

    /**
     * Utility method to format time string
     * @param {number} hour 
     * @param {number} minutes 
     * @returns {string}
     */
    formatTime(hour, minutes) {
        return `${hour}:${minutes.toString().padStart(2, '0')}`;
    }

    /**
     * Utility method to get time difference in minutes
     * @param {number} startHour 
     * @param {number} startMinutes 
     * @param {number} endHour 
     * @param {number} endMinutes 
     * @returns {number}
     */
    getTimeDifference(startHour, startMinutes, endHour, endMinutes) {
        const totalStartMinutes = startHour * 60 + startMinutes;
        const totalEndMinutes = endHour * 60 + endMinutes;
        return totalEndMinutes - totalStartMinutes;
    }

    /**
     * Utility method to convert minutes to hours and minutes
     * @param {number} totalMinutes 
     * @returns {Object}
     */
    minutesToTime(totalMinutes) {
        return {
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60
        };
    }
}

export { TimeQuestion };