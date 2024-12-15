//shape_question.js
import { Question } from "./base_question.js";
import { QuestUtils } from "./base_question.js";


class ShapeProperties extends Question {
    constructor(grade) {
        super(grade);
        this.shapes = {
            basic: [
                { symbol: '▢', name: 'square', sides: 4, angles: 4, properties: ['equal sides', 'right angles'] },
                { symbol: '△', name: 'triangle', sides: 3, angles: 3, properties: ['three equal sides'] },
                { symbol: '○', name: 'circle', sides: 0, angles: 0, properties: ['round', 'no corners'] },
                { symbol: '▯', name: 'rectangle', sides: 4, angles: 4, properties: ['four right angles', 'parallel sides'] },
                { symbol: '◇', name: 'diamond', sides: 4, angles: 4, properties: ['four equal sides'] }
            ],
            advanced: [
                { symbol: '⬟', name: 'pentagon', sides: 5, angles: 5, properties: ['five equal sides', 'five equal angles'] },
                { symbol: '⬡', name: 'hexagon', sides: 6, angles: 6, properties: ['six equal sides', 'six equal angles'] },
                { symbol: '⯃', name: 'octagon', sides: 8, angles: 8, properties: ['eight equal sides', 'eight equal angles'] },
                { symbol: '⏜', name: 'semicircle', sides: 1, angles: 0, properties: ['one curved side', 'one straight side'] },
                { symbol: '⏢', name: 'trapezoid', sides: 4, angles: 4, properties: ['two parallel sides', 'four angles'] }
            ]
        };
    }

    getAvailableShapes() {
        if (this.grade <= 0.5) {
            // Early K: Just triangle, square, circle
            return this.shapes.basic.slice(0, 3);
        } else if (this.grade <= 1.0) {
            // Late K: Add rectangle and diamond
            return this.shapes.basic;
        } else if (this.grade <= 1.5) {
            // Grade 1.5: Add pentagon
            return [...this.shapes.basic, this.shapes.advanced[0]];
        } else if (this.grade <= 2.0) {
            // Grade 2: Add hexagon and trapezoid
            return [...this.shapes.basic, ...this.shapes.advanced.slice(0, 2), this.shapes.advanced[4]];
        } else {
            // Grade 2.5-3: All shapes including octagon and semicircle
            return [...this.shapes.basic, ...this.shapes.advanced];
        }
    }

    generate() {
        const shapes = this.getAvailableShapes();
        const shape = shapes[QuestUtils.random(0, shapes.length - 1)];

        if (this.grade <= 0.5) {
            // Early K: Simple identification
            this.questionText = `What shape is this? ${shape.symbol}`;
            this.correctAnswer = shape.name;
            this.wrongAnswers = this.generateWrongShapeNames(shapes, shape);
            this.feedback = `Look at the shape carefully.`;

        } else if (this.grade <= 1.0) {
            // Late K: Counting sides or corners
            const askSides = Math.random() < 0.5;
            this.questionText = `How many ${askSides ? 'sides' : 'corners'} does this shape have? ${shape.symbol}`;
            this.correctAnswer = askSides ? shape.sides : shape.angles;
            this.wrongAnswers = this.generateWrongCounts(shape);
            this.feedback = `Count the ${askSides ? 'sides' : 'corners'} one by one.`;

        } else if (this.grade <= 2.0) {
            // Grade 1-2: Properties and naming
            if (Math.random() < 0.5 && shape.sides > 0) {  // Don't ask about equal sides for circle
                this.questionText = `How many equal sides does this shape have? ${shape.symbol}`;
                this.correctAnswer = shape.sides;
                this.wrongAnswers = this.generateWrongCounts(shape);
                this.feedback = `Count the sides - are they all the same length?`;
            } else {
                this.questionText = `What kind of shape is this? ${shape.symbol}`;
                this.correctAnswer = shape.name;
                this.wrongAnswers = this.generateWrongShapeNames(shapes, shape);
                this.feedback = `Count the sides to identify the shape.`;
            }

        } else {
            // Grade 2.5-3: Properties and relationships
            if (Math.random() < 0.5) {
                this.questionText = `Which is true about this shape? ${shape.symbol}`;
                this.correctAnswer = shape.properties[0];
                this.wrongAnswers = this.generateWrongProperties(shapes, shape);
                this.feedback = `Think about the sides and angles of the shape.`;
            } else {
                this.questionText = `This is a ${shape.name}. What makes it special?`;
                this.correctAnswer = shape.properties[0];
                this.wrongAnswers = this.generateWrongProperties(shapes, shape);
                this.feedback = `Look at the number and type of sides.`;
            }
        }

        return this;
    }

    generateWrongShapeNames(shapes, correctShape) {
        return shapes
            .filter(s => s.name !== correctShape.name)
            .map(s => s.name)
            .slice(0, 3);
    }

    generateWrongCounts(shape) {
        const count = shape.sides;
        return [
            count + 1,
            Math.max(0, count - 1),
            count === 0 ? 1 : count + 2  // Special case for circle
        ];
    }

    generateWrongProperties(shapes, correctShape) {
        const wrongProperties = [
            `${correctShape.sides + 1} equal sides`,
            `${correctShape.sides - 1} equal sides`,
            `${correctShape.angles + 1} equal angles`,
            'unequal sides',
            'no parallel sides',
            'only two equal sides'
        ];
        
        return wrongProperties
            .filter(p => !correctShape.properties.includes(p))
            .slice(0, 3);
    }
}
export { ShapeProperties };