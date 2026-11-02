// The Common Core math standards for kindergarten through 6th grade, each with
// a short title in our own words. The curriculum (src/curriculum.js) says which
// question types cover which standards; tools/standards_coverage.js reports
// what is covered and what is still to do.
//
// A few standards are about doing things with hands: writing numerals,
// showing sums with fingers, building and putting together shapes, measuring
// with a real ruler. The game asks a stand-in for each, such as choosing the
// numeral for a number word, the number sentence for a picture, or the shapes
// a shape is made of; the hands-on part is still best done with paper, straws
// and blocks. A standard the game can't stand in for at all would be marked *
// and counted apart.

/**
 * @typedef {object} Standard
 * @property {string} code  e.g. "3.NF.2"
 * @property {number} grade  0 for kindergarten
 * @property {string} title
 * @property {boolean} handsOn  better done away from the screen
 */

const TABLE = `
K.CC.1 Count to 100 by ones and by tens
K.CC.2 Count forward from a given number
K.CC.3 Write numbers from 0 to 20
K.CC.4 Connect counting to how many there are
K.CC.5 Count to answer "how many?" up to 20
K.CC.6 Compare groups: greater, less or equal
K.CC.7 Compare two numbers between 1 and 10
K.OA.1 Show addition and subtraction with objects, fingers and drawings
K.OA.2 Addition and subtraction word problems within 10
K.OA.3 Break numbers up to 10 into pairs
K.OA.4 Find the number that makes 10
K.OA.5 Fluently add and subtract within 5
K.NBT.1 Teen numbers as ten ones and some more
K.MD.1 Describe measurable attributes
K.MD.2 Compare two objects by length, weight or height
K.MD.3 Sort objects into categories and count them
K.G.1 Positions: above, below, beside, in front, behind
K.G.2 Name shapes whatever their size or turn
K.G.3 Flat shapes and solid shapes
K.G.4 Compare flat and solid shapes
K.G.5 Build and draw shapes
K.G.6 Put simple shapes together into bigger ones
1.OA.1 Addition and subtraction word problems within 20
1.OA.2 Word problems adding three numbers
1.OA.3 Properties of operations: order and grouping
1.OA.4 Subtraction as finding a missing addend
1.OA.5 Counting on and back to add and subtract
1.OA.6 Add and subtract within 20, fluently within 10
1.OA.7 The equal sign: true and false equations
1.OA.8 The missing number in an addition or subtraction
1.NBT.1 Count, read and write numbers to 120
1.NBT.2 Two-digit numbers as tens and ones
1.NBT.3 Compare two-digit numbers with >, = and <
1.NBT.4 Add within 100 using place value
1.NBT.5 Ten more and ten less in your head
1.NBT.6 Subtract multiples of 10
1.MD.1 Order and compare lengths
1.MD.2 Measure length with same-size units
1.MD.3 Tell time in hours and half hours
1.MD.4 Data with up to three categories
1.G.1 Defining attributes of shapes
1.G.2 Put shapes together to make new shapes
1.G.3 Halves and fourths of circles and rectangles
2.OA.1 One- and two-step word problems within 100
2.OA.2 Fluently add and subtract within 20
2.OA.3 Odd and even numbers
2.OA.4 Arrays: rows and columns of equal size
2.NBT.1 Three-digit numbers as hundreds, tens and ones
2.NBT.2 Count within 1000; skip-count by 5s, 10s and 100s
2.NBT.3 Numbers to 1000 in numerals, words and expanded form
2.NBT.4 Compare three-digit numbers
2.NBT.5 Fluently add and subtract within 100
2.NBT.6 Add up to four two-digit numbers
2.NBT.7 Add and subtract within 1000
2.NBT.8 Add or subtract 10 or 100 in your head
2.NBT.9 Explain why adding and subtracting strategies work
2.MD.1 Measure length with a ruler or other tool
2.MD.2 Measure one length in two different units
2.MD.3 Estimate lengths
2.MD.4 How much longer one object is than another
2.MD.5 Length word problems within 100
2.MD.6 Whole numbers on a number line
2.MD.7 Tell time to five minutes, with a.m. and p.m.
2.MD.8 Money word problems with bills and coins
2.MD.9 Line plots of measurements
2.MD.10 Picture graphs and bar graphs
2.G.1 Shapes with given numbers of angles or faces
2.G.2 Split a rectangle into rows and columns of squares
2.G.3 Halves, thirds and fourths of circles and rectangles
3.OA.1 Products as equal groups
3.OA.2 Quotients as equal shares
3.OA.3 Multiplication and division word problems within 100
3.OA.4 The missing number in a multiplication or division
3.OA.5 Properties of multiplication
3.OA.6 Division as a missing factor
3.OA.7 Fluently multiply and divide within 100
3.OA.8 Two-step word problems with all four operations
3.OA.9 Number patterns
3.NBT.1 Round to the nearest 10 or 100
3.NBT.2 Fluently add and subtract within 1000
3.NBT.3 Multiply one-digit numbers by multiples of 10
3.NF.1 Unit fractions and fractions a/b
3.NF.2 Fractions on a number line
3.NF.3 Equivalent fractions and comparing fractions
3.MD.1 Time to the minute and elapsed time
3.MD.2 Liquid volume and mass
3.MD.3 Scaled picture graphs and bar graphs
3.MD.4 Line plots with halves and fourths
3.MD.5 Area as a count of unit squares
3.MD.6 Measure area by counting unit squares
3.MD.7 Area by multiplying side lengths
3.MD.8 Perimeter of polygons
3.G.1 Kinds of quadrilaterals
3.G.2 Split shapes into parts with equal areas
4.OA.1 Multiplication as comparing: "times as many"
4.OA.2 Word problems comparing by multiplication
4.OA.3 Multistep word problems, including remainders
4.OA.4 Factors, multiples, primes and composites
4.OA.5 Patterns that follow a rule
4.NBT.1 Each place is ten times the place to its right
4.NBT.2 Read, write and compare multi-digit numbers
4.NBT.3 Round multi-digit numbers to any place
4.NBT.4 Fluently add and subtract multi-digit numbers
4.NBT.5 Multiply up to four digits by one, and two digits by two
4.NBT.6 Divide up to four digits by one, with remainders
4.NF.1 Equivalent fractions
4.NF.2 Compare fractions with different denominators
4.NF.3 Add and subtract fractions and mixed numbers with like denominators
4.NF.4 Multiply a fraction by a whole number
4.NF.5 Add tenths and hundredths
4.NF.6 Decimals for tenths and hundredths
4.NF.7 Compare decimals to hundredths
4.MD.1 Convert measurements within a system
4.MD.2 Distance, time, volume, mass and money word problems
4.MD.3 Area and perimeter of rectangles
4.MD.4 Line plots with fractions
4.MD.5 Angles measured in degrees
4.MD.6 Measure angles with a protractor
4.MD.7 Add angle measures
4.G.1 Points, lines, rays, angles, parallel and perpendicular lines
4.G.2 Sort shapes by their lines and angles
4.G.3 Lines of symmetry
5.OA.1 Parentheses and brackets in expressions
5.OA.2 Write and read simple expressions
5.OA.3 Two number patterns and how they relate
5.NBT.1 Each place is ten times and one tenth of its neighbors
5.NBT.2 Powers of 10
5.NBT.3 Read, write and compare decimals to thousandths
5.NBT.4 Round decimals
5.NBT.5 Fluently multiply multi-digit whole numbers
5.NBT.6 Divide up to four digits by two digits
5.NBT.7 Add, subtract, multiply and divide decimals to hundredths
5.NF.1 Add and subtract fractions with unlike denominators
5.NF.2 Word problems adding and subtracting fractions
5.NF.3 A fraction as division
5.NF.4 Multiply fractions
5.NF.5 Multiplying as resizing
5.NF.6 Word problems multiplying fractions
5.NF.7 Divide with unit fractions and whole numbers
5.MD.1 Convert units of measure
5.MD.2 Line plots with fractions
5.MD.3 Volume as unit cubes
5.MD.4 Measure volume by counting unit cubes
5.MD.5 Volume by multiplying length, width and height
5.G.1 The coordinate plane
5.G.2 Points in the first quadrant
5.G.3 Properties shared by kinds of shapes
5.G.4 Sort shapes into a hierarchy
6.RP.1 Ratios and ratio language
6.RP.2 Unit rates
6.RP.3 Ratio and rate problems, including percents
6.NS.1 Divide fractions by fractions
6.NS.2 Fluently divide multi-digit numbers
6.NS.3 Fluently add, subtract, multiply and divide decimals
6.NS.4 Greatest common factor and least common multiple
6.NS.5 Positive and negative numbers
6.NS.6 Negative numbers on number lines and the coordinate plane
6.NS.7 Order and absolute value
6.NS.8 Coordinate plane problems in all four quadrants
6.EE.1 Whole-number exponents
6.EE.2 Expressions with letters for numbers
6.EE.3 Make equivalent expressions
6.EE.4 Tell when expressions are equivalent
6.EE.5 Which values make an equation or inequality true
6.EE.6 Letters for unknown numbers in real problems
6.EE.7 Solve one-step equations
6.EE.8 Inequalities like x > c
6.EE.9 Dependent and independent variables
6.G.1 Area of triangles, quadrilaterals and polygons
6.G.2 Volume with fractional edges
6.G.3 Polygons on the coordinate plane
6.G.4 Nets and surface area
6.SP.1 Statistical questions
6.SP.2 Center, spread and shape of data
6.SP.3 Measures of center and of spread
6.SP.4 Dot plots, histograms and box plots
6.SP.5 Summarize data sets
`;

/** @type {readonly Standard[]} */
export const STANDARDS = TABLE.trim().split("\n").map(line => {
  const [, code, star, title] = /** @type {RegExpMatchArray} */ (line.match(/^(\S+?)(\*?) (.+)$/));
  const grade = code.startsWith("K") ? 0 : Number(code[0]);
  return { code, grade, title, handsOn: star === "*" };
});

/**
 * @param {string} code
 */
export function standardFor(code) {
  return STANDARDS.find(s => s.code === code);
}
