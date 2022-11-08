"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

// Freezes argument object.
const Node = n => Object.freeze(n);

// type Expr
const none = line => {
    return Node({ kind: 'none', value: null, line });
}
exports.none = none
const bool = (value, line) => {
    return Node({ kind: 'boolean', value, line });
}
exports.bool = bool;
const number = (value, line) => {
    return Node({ kind: 'number', value: Number(value), line });
}
exports.number = number;
const string = (value, line) => {
    return Node({ kind: 'string', value, line });
}
exports.string = string;
const identifier = (name, line) => {
    return Node({ kind: 'identifier', name, line });
}
exports.identifier = identifier;
const variable = ( name, line) => {
    return Node({ kind: 'variable', name, line });
}
exports.variable = variable;
const unop = (op,  expr, line) => {
    return Node({ kind: 'unop', op,  expr, line });
}
exports.unop = unop;
const binop = (op, e1, e2, line) => {
    return Node({ kind: 'binop', op, e1, e2, line });
}
exports.binop = binop;
const call = (fun, args, line) => {
    return Node({ kind: 'call', fun, args, line }); 
}
exports.call = call;
const closure = (params, body, line) => {
    return Node({ kind: 'closure', params, body, line });
}
exports.closure = closure;
const attribute = (collection, attribute, line) => {
    return Node({ kind: 'attribute', collection , attribute, line });
}
exports.attribute = attribute;
const subscriptor = (collection, expr, line) => {
    return Node({ kind: 'subscriptor', collection, expr, line });
}
exports.subscriptor = subscriptor;
const collection = (value, line) => {
    return Node({ kind: 'collection', value, line });
}
exports.collection = collection
const ternary = (test, trueExpr, falseExpr, line) => {
    return Node({ kind: 'ternary', test, trueExpr, falseExpr, line });
}
exports.ternary = ternary;


// type Stmt
const static_ =  expr => {
    return Node({ kind: 'static',  expr });
}
exports.static_ = static_;
const assignment = (assignArr,  expr) => {
    return Node({ kind: 'assignment', assignArr,  expr });
}
exports.assignment = assignment;
const if_ = (truePartArr, falsePart) => {
    return Node({ kind: 'if', truePartArr, falsePart });
}
exports.if_ = if_;
const for_ = (inits, test, updates, body) => {
    return Node({ kind: 'for', inits, test, updates, body });
}
exports.for_ = for_;
const while_ = (test, body) => {
    return Node({ kind: 'while', test, body });
}
exports.while_ = while_;
const return_ =  (expr, line) => {
    return Node({ kind: 'return', expr, line });
}
exports.return_ = return_;
const delete_ =  (expr, line) => {
    return Node({ kind: 'delete', expr, line });
}
exports.delete_ = delete_
const break_ = line => {
    return Node({ kind: 'break', line });
}
exports.break_ = break_
const continue_ = line => {
    return Node({ kind: 'continue', line });
}
exports.continue_ = continue_