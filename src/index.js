Object.defineProperty(exports, "__esModule", { value: true });
const { interpProgram } = require('./interpreter/interp.js');
const { parseProgram } = require('./parser/parse.js');
exports.parseProgram = parseProgram;
exports.interpProgram = interpProgram;

// Parse and interpret progam.
// runProgram(input: string): { kind: 'ok' | 'error', output: string[] }
const runProgram = input => interpProgram(parseProgram(input));
exports.runProgram = runProgram;
