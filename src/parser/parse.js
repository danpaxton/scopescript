"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import Parsimmon.
const P = require("parsimmon");
// Import ast types.
const a = require("./ast");
// Import result types.
const { error } = require("./result");
// Import type checking.
const vc = require("./vc");

//Parser to match comment
const comment = P.regex(/#.*/).wrap(P.optWhitespace, P.optWhitespace).atLeast(1);

// Parser to match optional whitespace.
const ws = comment.or(P.optWhitespace);

// Parser to match whitespace.
const ws1 = comment.or(P.whitespace);

// Parser that retrieves line number. 
const lineNum = P.index.map(obj => obj.line);

// token(name_tok: String): Parser<String>
const token = name_tok => ws.then(P.string(name_tok)).skip(ws);

// operator(name_op: String): Parser<String>
const operator = name_op => P.string(name_op).skip(ws);

// Parser that matches a semicolon at least once.
const semiColon1 = operator(';').atLeast(1);

// Parser that matches a semicolon 0 or more times.
const semiColon = operator(';').many();

// parseOp(ops: String[]): Parser<String>
const parseOp = ops => {
    const find = (arr, i) => (i >= ops.length) ? P.fail('') : token(arr[i]).or(find(arr, i + 1));
    return find(ops, 0); 
}

// getOp(ops: String[]): String
const getOp = (op, ops) => ops.reduce((acc, e) => (e === op ? op : acc), undefined)


// map<A, B, C>(f: (a: A, b: B) => C, firstParser: Parser<A>, secondParser: Parser<B>): C
const map = (f, firstParser, secondParser) => lineNum.chain(line => P.seq(firstParser, secondParser).map(arr => f(line, arr[0], arr[1])));


// binopMatch(ops: String[], otherParser: Parser<Expression>): AST Binop
const binopMatch = (ops, otherParser) => {
    // binopMap(lhs: Expr, binopSequnces: [[op: String, rhs: Expr], [...]]): AST Binop
    const binopMap = (line, lhs, binopSequences) => binopSequences.reduce((acc, currVal) => a.binop(getOp(currVal[0], ops), acc, currVal[1], line), lhs);
    return map(binopMap, otherParser, P.seq(parseOp(ops), otherParser).many());
}


// unopMatch(ops: String[], otherParser: Parser<Expression>): AST Unop
const unopMatch = (ops, otherParser) => map((line, op, expr) => a.unop(getOp(op, ops), expr, line), parseOp(ops), otherParser);


// cmpMatch(ops: String[], otherParser: Parser<Expr>): AST Binop
const cmpMatch = (ops, otherParser) => {
    // getOp(lhs: Expr, cmpSequences: [[op: String, rhs: Expr], [...]]): AST Binop
    const cmpMap = (line, lhs, cmpSequences) => {
        let acc = (cmpSequences.length < 1) ? lhs 
            : a.binop(getOp(cmpSequences[0][0], ops), lhs, cmpSequences[0][1], line); 
        for(let i = 1; i < cmpSequences.length; ++i) {
            acc = a.binop('&&', acc, a.binop(getOp(cmpSequences[i][0], ops), cmpSequences[i - 1][1], cmpSequences[i][1], line), line);
        }
        return acc; 
    }
    return map(cmpMap, otherParser, P.seq(parseOp(ops), otherParser).many());
}


// ternaryMatch(otherParser: Parser<Expr>): AST Ternary
const ternaryMatch = otherParser => {
    const ternaryMap = (line, truePartArr, falsePart) => a.ternary(truePartArr[0], truePartArr[1], falsePart, line);
    return map(ternaryMap , P.seq(otherParser, token('?').then(otherParser), token(':')), (otherParser));
}

// Matches numbers and infinity.
const numMatch = P.alt(P.regexp(/[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)([eE][+-]?[0-9]+)?/), P.string('Infinity'), P.string('-Infinity'))
    .desc('number').skip(ws);

// Matches strings.
const stringMatch = P.regex(/(['"])(\1|(.(?!\1))*.\1)/s).desc('string').map(str => str.slice(1, str.length - 1)).skip(ws);

// Parser that matches a number as a string (+ or -) in range [0-9] 1 or more times and then maps to an ast number.
const num = lineNum.chain(line => numMatch.map(str => a.number(str, line)));

// Parser that matches ASCII characters 0 or more times between " " or ' ' only.
const string = lineNum.chain(line => stringMatch.map(str => a.string(str, line)));

// Parser that matches a boolean value as a string and then maps to an ast bool.
const bool = lineNum.chain(line => P.string('true').map(_ => true).or(P.string('false').map(_ => false)).desc('boolean').skip(ws).map(val => a.bool(val, line)));

// Paser that matches None as a string and maps to an ast none.
const none = lineNum.chain(line => P.string('none').desc('none').skip(ws).map(_ => a.none(line)));

// Parser that matches a identifier character (upper or lower case) 0 or more times.
const special = new Set(['if', 'else', 'for', 'while', 'return', 'break', 'continue', 'delete', 'none']);
const name = P.regexp(/[a-zA-Z_$][a-zA-Z_$0-9]*/).assert(name => !special.has(name)).desc('identifier').skip(ws);

// Parser that matches a closure and then maps parameters, and body to a an ast closure.
const closure = P.lazy(() => lineNum.chain(line => name.sepBy(operator(',')).wrap(operator('('), operator(')'))
    .or(P.seq(name)).skip(operator('=>')).chain(params => returnLine.or(blockMany).map(block => a.closure(params, block, line)))))

// Parser that mathces a collection and maps all key value pairs to an ast collection.
const collection = P.lazy(() => lineNum.chain(line => 
    P.seq(P.alt(stringMatch, numMatch, name).skip(operator(':')), expr).sepBy(operator(','))
    .wrap(operator('{'), operator('}')).desc('collection').skip(ws)
    .map(pairs => a.collection(pairs.reduce((acc, e) =>  {
        acc[e[0]] = e[1];
        return acc;
    }, {}), line))));


// Parser that matches using a bool, variable, string, collection, closure, none, or num parser. Otherwise parse expression between parentheses.
const atom = ws.then(string
    .or(num)
    .or(bool)
    .or(none)
    .or(num)
    .or(closure)
    .or(collection)
    .or(lineNum.chain(line => name.map(str => a.variable(str, line)))) // map name to an ast variable.
    .or(P.lazy(() => expr.wrap(operator('('), operator(')')))));

// call_reference_subscription: AST Call | attribute | Subscriptor 
const call_attr_sub = P.lazy(() => lineNum.chain(line => atom.chain(lhs => 
    P.alt(P.seqObj(['call', expr.sepBy(operator(',')).wrap(operator('('), operator(')'))])
        , P.seqObj(['attribute', token('.').then(name)])
        , P.seqObj(['subscriptor', expr.wrap(operator('['), operator(']'))])).many().map(seqObj => 
            seqObj.reduce((acc, currVal) => {
                if (currVal.call !== undefined) {
                    return a.call(acc, currVal.call, line);
                }
                else if(currVal.attribute !== undefined) {
                    return a.attribute(acc, currVal.attribute, line);
                } else {
                    return a.subscriptor(acc, currVal.subscriptor, line);
                }
            }, lhs))))) 

// unary: AST Unop
const unary = unopMatch(['!', '~','++', '--', '+', '-'], call_attr_sub);

// mul: AST Binop
const mul = binopMatch(['*', '//', '/', '%'], call_attr_sub.or(unary));

// add: AST Binop
const add = binopMatch(['+', '-'], mul);

// bit: AST Binop
const bit = binopMatch(['>>', '<<'], add);

// bitAnd: AST Binop
const bitAnd = binopMatch(['&'], bit);

// bitOr: AST Binop
const bitOr = binopMatch(['|'], bitAnd);

// bitXor: AST Binop
const bitXor = binopMatch(['^'], bitOr);

// cmp: AST Binop
const cmp = cmpMatch(['>=', '<=', '==', '!=', '>', '<'], bitXor);

// and: AST Binop
const and = binopMatch(['&&'], cmp);

// or: AST Binop
const or = binopMatch(['||'], and);

// ternary: AST Ternary
const ternary = ternaryMatch(or);

// expr: Parser
const expr = ternary.or(or);


// Statment Matching.


// Parser that will match only references and subscriptors, for assignment purposes.
const reference_or_subscription = P.lazy(() => lineNum.chain(line => atom.chain(lhs => P.alt(P.seqObj(['attr', token('.').then(name)])
        , P.seqObj(['sub', expr.wrap(operator('['), operator(']'))])).atLeast(1).map(seqObj => 
            seqObj.reduce((acc, currVal) => {
                if(currVal.attr !== undefined) {
                    return a.attribute(acc, currVal.attr, line);
                } else {
                    return a.subscriptor(acc, currVal.sub, line);
                }
            }, lhs)))))

// Parser that matches appropriate left hand side arguments for assignments.
const assignments = reference_or_subscription.or(lineNum.chain(line => name.map(n => a.identifier(n, line))));

// Parser that matches a sequence of simple assignments and maps each identifier, attribute, or subscriptor to an ast assignment.
const simpleAssignments = endline => assignments.skip(P.string('=').notFollowedBy(P.string('>').or(P.string('='))).skip(ws)).atLeast(1)
    .chain(names => expr.skip(endline).map(expr => a.assignment(names, expr)))

// Parser that matches a compound assignment '+=','-=','*=','//=', '/=','%=','<<=','>>=','&=','^=','|='.
const compoundAssignment = (cmpdAssignments, endline) => P.seq(assignments, parseOp(cmpdAssignments)).chain(arr => expr.skip(endline).map(expr => 
    cmpdAssignments.reduce((acc, e) => arr[1] !== e ? acc : a.assignment([arr[0]]
            , a.binop(arr[1].slice(0, Math.ceil(arr[1].length / 2)), arr[0].kind === 'identifier' ? a.variable(arr[0].name, arr[0].line) 
                : arr[0], expr, arr[0].line)), undefined)))


// assignmentStmt: AST Assignment
const assignmentStmt = endline => ws.then(compoundAssignment(['+=','-=','*=','//=','/=','%=','<<=','>>=','&=','^=','|='], endline).or(simpleAssignments(endline)))


// staticExprStmt: AST Static
const staticExprStmt = endline => expr.skip(endline).map(expression => a.static_(expression));


// whileStmt: AST While
const whileStmt = P.lazy(() => token('while').then(expr.wrap(operator('('), operator(')'))) // loop condition
    .chain(test => block.map(body => a.while_(test, body))).skip(semiColon)); // loop body 


const forStmt = P.lazy(() => token('for').skip(operator('('))
    .then(P.seq(assignmentStmt(operator(',')).many().chain(arr => assignmentStmt(operator(';')).map(last => (arr.push(last), arr)))  // initializations
    , expr.skip(operator(';')) // loop condiditon
    , assignOrStatic(operator(',')).many().chain(arr => assignOrStatic(operator(')')).map(last => (arr.push(last), arr))))) // loop updates
    .chain(forArr => block.map(body => a.for_(forArr[0], forArr[1], forArr[2], body))).skip(semiColon));
    
    // Parser that matches an assignment or static statement
    const assignOrStatic = endline => staticExprStmt(endline).or(assignmentStmt(endline));


// ifStmt: AST If
const ifStmt = P.lazy(() => P.seqObj(['test', token('if').then(expr.wrap(operator('('), operator(')')))], ['part', block]) // initial if statement
    .chain(ifStmt => P.seqObj(['test', token('else if').then(expr.wrap(operator('('), operator(')')))], ['part', block]).many() // else if array
    .map(elifArr => (elifArr.unshift(ifStmt), elifArr))).chain(truePartArr => token('else') // combine initial if with else if array
    .then(block).fallback([]).map(falsePart => a.if_(truePartArr, falsePart))).skip(semiColon)) // else part if it exists


// returnStmt: AST Return
const returnStmt = lineNum.chain(line => ws.then(P.string('return')).then(ws1.then(expr).or(expr.wrap(operator('('), operator(')'))).map(expression => a.return_(expression, line))
    .or(ws.map(_ => a.return_(a.none(line), line))))).skip(semiColon1);


//deleteStmt: AST Delete
const deleteStmt = lineNum.chain(line => ws.then(P.string('delete')).then(ws1.then(expr).or(expr.wrap(operator('('), operator(')')))).skip(semiColon1).map(expr => a.delete_(expr, line)));

//breakStmt: AST Break
const breakStmt = lineNum.chain(line => token('break').skip(semiColon1).map(_ => a.break_(line)));

//continueStmt: AST Continue
const continueStmt = lineNum.chain(line => token('continue').skip(semiColon1).map(_ => a.continue_(line)));

// stmt: Parser
const stmt = P.lazy(() => ifStmt
    .or(forStmt)
    .or(whileStmt)
    .or(returnStmt)
    .or(deleteStmt)
    .or(breakStmt)
    .or(continueStmt)
    .or(staticExprStmt(semiColon1))
    .or(assignmentStmt(semiColon1)));


// block: Stmt[]
const block = P.lazy(() => stmt.map(s => [s]).or(stmt.many().wrap(operator('{'), operator('}'))));

// blockMany: Stmt[]
const blockMany = P.lazy(() => stmt.many().wrap(operator('{'), operator('}')));

// returnLine: Stmt[]
const returnLine = P.lazy(() => lineNum.chain(line => expr.map(expr => a.return_(expr, line))).map(ret => [ret]));

// parseExpression(input: String): AST Expr
const parseExpression = input => {
    const result = expr.parse(input);
    if (result.status) {
        return result.value;
    } else {
        return error(`Line ${result.index.line}: Parse error. Unexpected token.`);
    }
}
exports.parseExpression = parseExpression;

// parseStatement(input: String): AST Stmt
const parseStatement = input => {
    const result = stmt.parse(input);
    if (result.status) {
        return result.value;
    } else {
        return error(`Line ${result.index.line}: Parse error. Unexpected token.`);
    }
}
exports.parseStatement = parseStatement;

// parseProgram(input: String): Ok | Error
const parseProgram = input => {
    const result = ws.then(semiColon).then(stmt.many()).skip(P.end).parse(input);
    if (result.status) {
        const stmts = result.value;
        return vc.vc(stmts).map(_ => stmts);
    } else {
        return error(`Line ${result.index.line}: Parse error. Unexpected token.`);
    }
}
exports.parseProgram = parseProgram;
