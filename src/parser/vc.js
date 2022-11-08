"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const r = require("./result");

const builtInFuncs = new Set(['type', 'ord', 'abs', 'len', 'bool', 'str', 'num', 'pow', 'keys', 'print']);

// getDuplicate<T>(a: T[]): T | undefined
const getDuplicate = a => {
    const set = new Set();
    for(const c of a) {
        if (set.has(c))
            return c
        
        set.add(c);
    }
    return null;
}

// addNames(arr: String[], vars: Set): Set
const addNames = (arr, vars) => {
    const newEnv = new Set(vars);
    for (const e of arr) {
        if (typeof(e) === 'string') {
            newEnv.add(e);
        } else if (e.kind === 'identifier') {
            newEnv.add(e.name);
        }
    }
    return newEnv;
}


// vcExpr(boundVars: Set, expression: Expr): OK | Error | Unreachable
function vcExpr(boundVars, expression) {
    switch(expression.kind) {
        case 'number': // fall
        case 'boolean': // ...
        case 'string': // through
        case 'none' : {
            return r.ok(undefined);
        }
        case 'call': {
            const x = expression.fun
            if (x.kind === 'variable') {
                if (boundVars.has(x.name) || builtInFuncs.has(x.name)) {
                    return r.foldLeftNoAcc(vcExpr, boundVars, expression.args);
                } else {
                    return r.error(`Line ${expression.line}: function ${x.name}(...) is not defined.`)
                }
            }
            return vcExpr(boundVars, x)
                        .then(_ => r.foldLeftNoAcc(vcExpr, boundVars, expression.args));
        }
        case 'attribute': {
            const x = expression.collection;
            if (x.kind === 'variable') {
                if (boundVars.has(x.name)) {
                    return r.ok(boundVars);
                }
                else if(builtInFuncs.has(x.name)) {
                    return r.error(`Line ${expression.line}: built-in funtion ${x.name}(...) cannot be referenced.`); 
                } else {
                    return r.error(`Line ${expression.line}: collection '${x.name}' is not defined.`);                
                }
            }
            return vcExpr(boundVars, x)
        }
        case 'subscriptor': {
            const x = expression.collection;
            if (x.kind === 'variable') {
                if (boundVars.has(x.name)) {
                    return vcExpr(boundVars, expression.expr);
                }
                else if(builtInFuncs.has(x.name)) {
                    return r.error(`Line ${expression.line}: built-in funtion ${x.name}(...) is not subscriptable.`) 
                }
                else {
                    return r.error(`Line ${expression.line}: collection '${x.name}' is not defined.`);                
                }
            }
            return vcExpr(boundVars, x)
                .then(_ => vcExpr(boundVars, expression.expr))
        }
        case 'closure': {
            const x = getDuplicate(expression.params);
            if (x) {
                return r.error(`Line ${expression.line}: duplicate closure parameter '${x}'.`);
            } else {
                return vcBlock(addNames(expression.params, boundVars), expression.body);
            }
        }
        case 'variable': {
            const x = expression.name
            if (boundVars.has(x)) {
                return r.ok(boundVars);
            } else {
                return r.error(`Line ${expression.line}: variable '${x}' is not defined.`);
            }
        }
        case 'unop': {
            return vcExpr(boundVars, expression.expr);
        }
        case 'binop': {
            return vcExpr(boundVars, expression.e1)
                .then(_ => vcExpr(boundVars, expression.e2));
        }
        case 'ternary': {
            return vcExpr(boundVars, expression.test)
                .then(_ => vcExpr(boundVars, expression.trueExpr))
                .then(_ => vcExpr(boundVars, expression.falseExpr))
        }
        case 'collection': {
            return r.foldLeftNoAcc(vcExpr, boundVars, Object.values(expression.value));
        }
        default: {
            return r.unreachable('unhandled case');
        }
    }
}


// vcBlock(env: Set, statements: Stmt[]): OK | Error | Unreachable
function vcBlock(env, statements) {
    return r.foldLeft(vcStmt, env, statements);
}


/* returns the environment because assignment statements declare variables that
    are visible to the next statement.*/
// vcStmt(env: Set, stmt: Stmt): Set
function vcStmt(env, stmt) {
    switch(stmt.kind) {
        case 'assignment': {
            const k = stmt.expr.kind;
            if (k === 'closure' || k === 'collection' ) {
                const new_env = addNames(stmt.assignArr, env) 
                return vcExpr(new_env, stmt.expr)
                    .map(_ => new_env);
            }
            return vcExpr(env, stmt.expr).map(_ => addNames(stmt.assignArr, env));
        }
        case 'if': {
            return r.foldLeftNoAcc(vcExpr, env, stmt.truePartArr.map(s => s.test))
                .then(_ => r.foldLeftNoAcc(vcBlock, env, stmt.truePartArr.map(s => s.part)))
                .then(_ => vcBlock(env, stmt.falsePart))
                .map(_=> env);
        }
        case 'for': {
            return r.foldLeft(vcStmt, env, stmt.inits)
                .then(env => vcExpr(env, stmt.test)
                .then(_ => r.foldLeftNoAcc((env, c) => {
                        if (c.kind === 'assignment') {
                            return c.assignArr.reduce((acc, e) => {
                                if (acc.getKind() === 'error') {
                                    return acc;
                                }
                                else if (e.kind == 'identifier') {
                                    acc = env.has(e.name) ? acc // remains OK
                                        : r.error(`Line ${e.line}: loop update variable '${e.name}' must be defined.`);
                                } else { // attribute reference or subscriptor otherwise
                                    acc = vcExpr(env, e);
                                }
                                return acc;
                            }, r.ok(undefined))
                        } else { // static otherwise
                            return vcExpr(env, c.expr);
                        }
                    }, env, stmt.updates))
                .then(_ => vcBlock(env, stmt.body)))
                .map(_ => env);
        }
        case 'while': {
            return vcExpr(env, stmt.test)
                .then(_ => vcBlock(env, stmt.body))
                .map(_ => env);
        }
        case 'delete': {
            const x = stmt.expr
            if (x.kind !== 'subscriptor' && x.kind !== 'attribute') {
                return r.error(`Line ${x.line}: delete(...) argument must be a collection attribute.`)
            }
            return vcExpr(env, x)
                .map(_ => env)
        }
        case 'return': // fall through
        case 'static': {
            return vcExpr(env, stmt.expr)
                .map(_ => env);
        }
        case 'break': // fall through
        case 'continue': {
            return r.ok(undefined).map(_ => env);
        }
        default: {
            return r.unreachable('unhandled case');
        }
    }
}
/*
  A simple "variable-checker", which only ensures that (1) variables are
  declared before they are used, (2) there are no duplicate parameters in closure definitions
  (3) Valid built-in function use, (4) Valid delete use.
 */
// vc(stmts: Stmts[]): Undefined
function vc(stmts) {
    return vcBlock(new Set(), stmts)
        .map(_ => undefined);
}
exports.vc = vc;
