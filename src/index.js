Object.defineProperty(exports, "__esModule", { value: true });
const { interpProgram } = require('./interpreter/interp.js');
const { parseProgram } = require('./parser/parse.js');
exports.parseProgram = parseProgram;
exports.interpProgram = interpProgram;

// Parse and interpret progam.
// runProgram(input: string): { kind: 'ok' | 'error', vars: Map, out: string[], last: string }
const runProgram = input => interpProgram(parseProgram(input));
exports.runProgram = runProgram;

// Parse and interpret program with old values.
// runProgram(input: string, vars: Map): { kind: 'ok' | 'error', vars: Map, out: string[], last: string }
const runProgramVars = (input, vars) => interpProgram(parseProgram(input, vars), vars);
exports.runProgramVars = runProgramVars;

