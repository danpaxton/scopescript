Object.defineProperty(exports, "__esModule", { value: true });
const { interpProgram } = require('./interpreter/interp.js');
const { parseProgram } = require('./parser/parse.js');
exports.parseProgram = parseProgram;
exports.interpProgram = interpProgram;

// Parse and interpret progam.
const runProgram = input => interpProgram(parseProgram(input));
exports.runProgram = runProgram;

console.log(runProgram("#a = 1;#"))