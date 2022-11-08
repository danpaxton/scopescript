"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const s = require('./scope');
const a = require('./atoms');

// error(msg: String): Error
const error = (msg) => {
    throw new Error(msg);
}

const primitives = {
    none: e => a.none(e.value),
    boolean: e => a.boolean(e.value),
    string: e => a.string(e.value),
    number: e => a.number(e.value),
}

const unops = {
   '!': (scope, e) => {
       return a.boolean(!evalExpr(scope, e.expr).value);
    },
    '~': (scope, e) => {
        const v = evalExpr(scope, e.expr);
        if (!a.isNumber(v)) {
            error(`Line ${e.line}: invalid operand type for '~': '${v.kind}'.`);
        }
        if (!a.isInteger(v)) {
            error(`Line ${e.line}: bit-wise '~' expected integer operand: Received '${v.value}'.`);
        }
        return a.number(~v.value);
    },
    '++': (scope, e) => {
        return prefix(scope, e, 1);
    },
    '--': (scope, e) => {
        return prefix(scope, e, -1);
    },
    '+': (scope, e) => {
        return plusOrMinus(scope, e, 1);
    },
    '-': (scope, e) => {
        return plusOrMinus(scope, e, -1);
    }
};

const binops = {
    '&&': (scope, e) => {
        const e1 = evalExpr(scope, e.e1);
        return !e1.value ? e1 : evalExpr(scope, e.e2);
    },
    '||': (scope, e) => {
        const e1 = evalExpr(scope, e.e1);
        return e1.value ? e1 : evalExpr(scope, e.e2);
    },
    '+': (scope, e) => {
        const [ type, v1, v2 ] = binopConcat(scope, e);
        return type(v1 + v2);
    },
    '-': (scope, e) => {
        const [ v1, v2 ] = binopNumeric(scope, e);
        return a.number(v1 - v2);
    },
    '*': (scope, e) => {
        const [ v1, v2 ] = binopNumeric(scope, e);
        return a.number(v1 * v2);
    },
    '/':(scope, e) => {
        const [ v1, v2 ] = binopNumeric(scope, e);
        return a.number(v1 / v2);
    },
    '//':(scope, e) => {
        const [ v1, v2 ] = binopNumeric(scope, e);
        return a.number(Math.floor(v1 / v2));
    },
    '%': (scope, e) => {
        const [ v1, v2 ] = binopNumeric(scope, e);
        return a.number(v1 % v2);
    },
    '<<': (scope, e) => {
        const [ v1, v2 ] = binopBit(scope, e);
        return a.number(v1 << v2);
    },
    '>>': (scope, e) => {
        const [ v1, v2 ] = binopBit(scope, e);
        return a.number(v1 >> v2);
    },
    '&':(scope, e) => {
        const [ v1, v2 ] = binopBit(scope, e);
        return a.number(v1 & v2);
    },
    '|':(scope, e) => {
        const [ v1, v2 ] = binopBit(scope, e);
        return a.number(v1 | v2);
    },
    '^': (scope, e) => {
        const [ v1, v2 ] = binopBit(scope, e);
        return a.number(v1 ^ v2);
    },
    '==': (scope, e) => {
        const v1 = evalExpr(scope, e.e1).value, v2 = evalExpr(scope, e.e2).value;
        return a.boolean(v1 === v2);
    },
    '!=': (scope, e) => {
        const v1 = evalExpr(scope, e.e1).value, v2 = evalExpr(scope, e.e2).value; 
        return a.boolean(v1 !== v2);
    },
    '<': (scope, e) => {
        const [ v1, v2 ] = binopCmp(scope, e);
        return a.boolean(v1 < v2);
    },
    '>': (scope, e) => {
        const [ v1, v2 ] = binopCmp(scope, e);
        return a.boolean(v1 > v2);
    },
    '<=': (scope, e) => {
        const [ v1, v2 ] = binopCmp(scope, e);
        return a.boolean(v1 <= v2);
    },
    '>=': (scope, e) => {
        const [ v1, v2 ] = binopCmp(scope, e);
        return a.boolean(v1 >= v2);
    }
}

const builtInFuncs = {
    'type': (scope, e) => {
        const args = e.args;
        if (args.length !== 1) {
            error(`Line ${e.line}: type(...) takes exactly 1 argument: Received ${args.length}.`);
        }
        return a.string(evalExpr(scope, args[0]).kind);
    },
    'len': (scope, e) => {
        const args = e.args;
        if (args.length !== 1) {
            error(`Line ${e.line}: len(...) takes exactly 1 argument: Received ${args.length}.`);
        }
        const iter = evalExpr(scope, args[0]);
        if (a.isString(iter)) {
            return a.number(iter.value.length);
        }
        if (!a.isCollection(iter)) {
            error(`Line ${e.line}: invalid argument type for len(...): '${iter.kind}'.`);
        }
        let c = 0;
        for(const _ in iter.value) {  
            ++c;
        }
        return a.number(c);
    },
    'ord': (scope, e) => {
        const args = e.args;
        if (args.length !== 1) {
            error(`Line ${e.line}: ord(...) takes exactly 1 argument: Received ${args.length}.`);
        }
        const char = evalExpr(scope, args[0]);
        if (!a.isString(char)) {
            error(`Line ${e.line}: invalid argument type for ord(...): '${char.kind}'.`);
        }
        if (char.value.length !== 1) {
            error(`Line ${e.line}: ord(...) expected a character: Received a string of size ${char.value.length}.`);
        }
        return a.number(char.value.charCodeAt(0));
    },
    'abs': (scope, e) => {
        const args = e.args;
        if (args.length !== 1) {
            error(`Line ${e.line}: abs(...) takes exactly 1 argument: Received ${args.length}.`);
        }
        const num = evalExpr(scope, args[0]);
        if (!a.isNumber(num)) {
            error(`Line ${e.line}: invalid argument type for abs(...): '${num.kind}'.`);
        }
        return a.number(Math.abs(num.value));
    },
    'pow': (scope, e) => {
        const args = e.args;
        if (args.length !== 2) {
            error(`Line ${e.line}: pow(...) takes exactly 2 arguments: Received ${args.length}.`);
        }
        const b = evalExpr(scope, args[0]), p = evalExpr(scope, args[1]);
        if (!a.areNumbers(b, p)) {
            error(`Line ${e.line}: invalid argument type(s) for pow(...): '${b.kind}' and '${p.kind}'.`);
        }
        return a.number(Math.pow(b.value, p.value));
    },
    'bool': (scope, e) => {
        const args = e.args;
        if (args.length !== 1) {
            error(`Line ${e.line}: bool(...) takes exactly 1 argument: Received ${args.length}.`);
        }
        return a.boolean(Boolean(evalExpr(scope, args[0]).value));
    },
    'num': (scope, e) => {
        const args = e.args;
        if (args.length !== 1) {
            error(`Line ${e.line}: num(...) takes exactly 1 argument: Received ${args.length}.`);
        }
        const num = evalExpr(scope, args[0]);
        if (a.isString(num)) {
            const val = Number(num.value);
            if (Number.isNaN(val)) {
                error(`Line ${e.line}: invalid literal for num(...): '${num.value}'.`);
            }
            return a.number(val);
        }
        if (!a.isNumber(num)) {
            error(`Line ${e.line}: invalid argument type for num(...): '${num.kind}'.`);
        }
        return a.number(Number(num.value));
    },
    'str': (scope, e) => {
        const args = e.args;
        if (args.length != 1) {
            error(`Line ${e.line}: str(...) takes exactly 1 argument: Received ${args.length}.`);
        }
        return a.string(a.strRep(evalExpr(scope, args[0])));
    },
    'keys': (scope, e) => {
        const args = e.args;
        if (args.length != 1) {
            error(`Line ${e.line}: keys(...) takes exactly 1 argument: Received ${args.length}.`);
        }
        const c = evalExpr(scope, args[0]);
        if (!a.isCollection(c)) {
            error(`Line ${e.line}: invalid argument type for keys(...): '${c.kind}'.`);
        }
        return a.collection(Object.assign({}, Object.keys(c.value)));
    },
    'print': (scope, e) => {
        (async () => {
            const out = scope.out();
            
            for (const arg of e.args) {
                // Push formatted value.
                out.push(a.strRep(evalExpr(scope, arg)));
                // Seperate args with space.
                out.push(' ');
            }
            // Prints at least one newline charcacter.
            out.push('\n');
        })();
        return a.none(null);
    }
}

const expressions = {
    variable: (scope, e) => {
        const val = s.findInScope(scope, e.name);
        if (!val) {
            error(`Line ${e.line}: variable '${e.name}' is not defined.`);
        }
        return val;
    },
    collection: (scope, e) => {
        const res = {};
        for (const [k, v] of Object.entries(e.value) ) {
            res[k] = evalExpr(scope, v);
        }
        return a.collection(res);
    },
    closure: (scope, e) => {
        return a.closure(s.Closure(scope, e.params, e.body));
    },
    unop: (scope, e) => {
        const op = unops[e.op];
        if (!op) {
            error(`Line ${e.line}: unknown unary operator '${op}'.`);
        }
        return op(scope, e);
    },
    binop: (scope, e) => {
        const op = binops[e.op];
        if (!op) {
            error(`Line ${e.line}: unknown binary operator '${op}'.`);
        }
        return op(scope, e);
    },
    attribute: (scope, e) => {
        const c = evalExpr(scope, e.collection);
        if (!a.isCollection(c)) {
            // error
            error(`Line ${e.line}: invalid collection type for attribute reference '${e.attribute}': '${c.kind}'.`);
        }
        return c.value[e.attribute] || a.none(null);
    },
    subscriptor: (scope, e) => {
        const c = evalExpr(scope, e.collection), attr = evalExpr(scope, e.expr);
        if (!a.validAttribute(attr)) {
            error(`Line ${e.line}: invalid attribute type for subscription: '${attr.kind}'.`);
        }
        if (!a.isCollection(c)) {
            if (a.isString(c)) {
                const i = attr.value, str = c.value;
                if (a.isInteger(attr) && i >= 0 && i < str.length) {
                    return a.string(str.charAt(i));
                }
                error(`Line ${e.line}: invalid string index for '${c.value}': '${i}'.`);
            }
            error(`Line ${e.line}: invalid collection type for subscriptor '${attr.value}': '${c.kind}'.`);
        }
        return c.value[String(attr.value)] || a.none(null);
    },
    ternary: (scope, e) => {
        return evalExpr(scope, e.test).value ? evalExpr(scope, e.trueExpr) : evalExpr(scope, e.falseExpr); 
    },
    call: (scope, e) => {
        let f = e.fun, funcExpr;
        let name = '(anonymous) '
        if (f.kind === 'variable') {
            // Named function.
            name = f.name;
            const res = s.findInScope(scope, name);
            if (res) {
                funcExpr = res;
            } else if (name in builtInFuncs) {
                return builtInFuncs[name](scope, e);
            } else {
                error(`Line ${e.line}: function ${name}(...) is not defined.`);
            }
        } else {
            // Anonymous function.
            funcExpr = evalExpr(scope, f);
        }
        if (!a.isClosure(funcExpr)) {
            error(`Line ${e.line}: invalid type for function call: ${funcExpr.kind}`);
        }
        const func = funcExpr.value;
        const params = func.params(), args = e.args;
        if (params.length !== args.length) {
            error(`Line ${e.line}: invalid argument count for ${name}(...): Expected ${params.length}.`);
        }
        // Create new function environent.
        const env = s.newEnv(func);
        // Map paramters to arguments in left-to-right order.
        for (let i = 0; i < args.length; ++i) {
            env[params[i]] = evalExpr(scope, args[i]);
        }
        try {
            // Set inFunc flag only.
            // Execute function body in it's own enviroment. Return none if no return value.
            const res = evalBlock(s.getEnv(func), func.body(), s.Flags(true, false));
            return res ? res[1] : a.none(null);
        } catch (excep) {
            // Recursion Error.
            if (excep instanceof RangeError) {
                error(`Line ${e.line}: max recursion-depth exceeded for ${name}(...).`);
            }
            error(excep.message);
        }
    }
}

const statements = {
    return: (scope, stmt, flags) => {
        if (!flags.inFunc()) {
            error(`Line ${stmt.line}: return outside of function.`);
        }
        // Return has value.
        return ['return', evalExpr(scope, stmt.expr)];
    },
    break: (scope, stmt, flags) => {
        if (!flags.inLoop()) {
            error(`Line ${stmt.line}: break outside of loop.`);
        }
        // Break has no value.
        return ['break'];
    },
    continue: (scope, stmt, flags) => {a
        if (!flags.inLoop()) {
            error(`Line ${stmt.line}: continue outside of loop.`);
        }
        // Continue has no value.
        return ['continue'];
    },
    static: (scope, stmt, flags) => {
        evalExpr(scope, stmt.expr);
        return null;
    },
        delete:  (scope, stmt, flags) => {
        const expr = stmt.expr;
        const attr = determineAttribute(scope, expr);
        if (!attr) {
            error(`Line ${stmt.line}: deletion expected attribute reference or subscription: Received '${expr.kind}'.`);
        }
        const c = evalExpr(scope, expr.collection);
        if (!a.isCollection(c)) {
            error(`Line ${stmt.line}: invalid collection type for deletion: '${c.kind}'.`);
        }
        if (attr in c.value) {
            delete c.value[attr];
        } else {
            error(`Line ${stmt.line}: unknown attribute reference for deletion: '${attr}'.`);
        }
        return null;
    },
    assignment: (scope, stmt, flags) => {
        const val = evalExpr(scope, stmt.expr);
        // Assign for all elements in the assignment chain.
        for (const e of stmt.assignArr) {
            if (!assignVal(scope, e, val)) {
                error(`Line ${e.line}: invalid assignment type: '${e.kind}'.`);
            }
        }
        return null;
    },
    if: (scope, stmt, flags) => {
        const newScope = s.childState(scope);
        // Return first part with a true test.
        for (const { test, part } of stmt.truePartArr) {
            if (evalExpr(scope, test).value) {
                return evalBlock(newScope, part, flags)
            }
        }
        // Return false part otherwise.
        return evalBlock(newScope, stmt.falsePart, flags);

    },
    while: (scope, stmt, flags) => {
        // Create new scope.
        const newScope = s.childState(scope);
        // Set inLoop flag, and maintain inFunc flag.
        const newFlags = s.Flags(flags.inFunc(), true);
        let res;
        while (evalExpr(scope, stmt.test).value) {
            res = evalBlock(newScope, stmt.body, newFlags);
            if (res) {
                if (res[0] === 'return') {
                    return res;
                }
                if (res[0] === 'break') {
                    return null;
                }
                // if (res[0] === 'continue' ) ...
            }
        }
        return null;
    },
    for: (scope, stmt, flags) => {
        // Create new scope.
        const newScope = s.childState(scope);
        // Loop initializers.
        for (const init of stmt.inits) {
            evalStmt(newScope, init);
        }
        // Set inLoop flag, and maintain inFunc flag.
        const newFlags = s.Flags(flags.inFunc(), true);
        let res;
        while(evalExpr(newScope, stmt.test).value) {
            res = evalBlock(newScope, stmt.body, newFlags);
            if (res) {
                if (res[0] === 'return') {
                    return res;
                }
                if (res[0] === 'break') {
                    return null;
                }
                // if (res[0] === 'continue' ) ...
            }
            // Loop updates.
            for (const update of stmt.updates) {
                evalStmt(newScope, update);
            }
        }
        return null;
    }
};

// evalExpr(scope: State, expr: Expr): Atom
const evalExpr = (scope, expr) => {
    const kind = expr.kind;
    if (kind in expressions) {
        return expressions[kind](scope, expr);
    }
    if (kind in primitives) {
        return primitives[kind](expr);
    }
    error(`Line ${expr.line}: unknown expression kind: '${kind}'.`);
};
exports.evalExpr = evalExpr;

// evalStmt(flags: Flags, scope: State, stmt: Statement): Atom | null
const evalStmt = (scope, stmt, flags = s.Flags(false, false)) => {
    const kind = stmt.kind;
    if (kind in statements) {
        return statements[kind](scope, stmt, flags);
    }
    error(`Line ${stmt.line}: unknown statement kind: '${kind}'.`);
};
exports.evalStmt = evalStmt;

// evalBlock(flags: Flags, scope: State, stmts: Statements[]): Atom | null
const evalBlock = (scope, stmts, flags) => {
    for (const stmt of stmts) {
        const retVal = evalStmt(scope, stmt, flags);
        if (retVal) {
            return retVal;
        }
    }
    return null;
}
exports.evalBlock = evalBlock;

// interpProgram(program: Program): { kind: String, out: String[] }
const interpProgram = (program) => {
    if (program.kind === 'ok') {
        try {
            const top = s.State(null);
            for (const stmt of program.value) {
                evalStmt(top, stmt);
            }
            return { kind: 'ok', out: top.out() };
        } catch (e) {
            return { kind: 'error', out: [e.message] };
        }
    } else {
        return { kind: 'error', out: [program.message] };
    }
};
exports.interpProgram = interpProgram;

// determineAttribute(scope: State, e: Object): String | null
const determineAttribute = (scope, e) => {
    if (a.isAttribute(e)) {
        return e.attribute; // String
    } else if (a.isSubscriptor(e)) {
        const attr = evalExpr(scope, e.expr);
        if (!a.validAttribute(attr)) {
            error(`Line ${e.line}: invalid attribute type for subscription: '${attr.kind}'.`);
        }
        return a.strRep(attr);
    } else {
        return null;
    }
};

// assignVal(scope: State, e: Expr, v: Atom): Atom
const assignVal = (scope, e, v) => {
    const kind = e.kind;
    if (kind === 'identifier' || kind === 'variable') {
        s.setVariable(scope, e.name, v);
        return v;
    }
    // Attribute or subscriptor.
    const attr = determineAttribute(scope, e);
    // Unknown assignment type.
    if (!attr) {
        return null;
    }
    // Get collection.
    const c = evalExpr(scope, e.collection);
    if (!a.isCollection(c)) {
        error(`Line ${e.line}: invalid collection type for attribute assignment '${attr}': '${c.kind}'.`);
    }
    // Assign value in collection.
    c.value[attr] = v;
    return v;
}

// prefix(scope: State, e: Expr, step: Number): Atom
const prefix = (scope, e, step) => {
    const expr = e.expr;
    const v = evalExpr(scope, expr);
    if (!a.isNumber(v)) {
        error(`Line ${e.line}: invalid operand type for '${e.op}': '${v.kind}'.`);
    }
    const res = assignVal(scope, expr, a.number(v.value + step));
    if(!res) {
        error(`Line ${e.line}: invalid prefix syntax for '${e.op}'.`);
    }
    return res;
}

// plusOrMinus(scope: State, e: Expr, fact: Number): Atom
const plusOrMinus = (scope, e, fact) => {
    const v = evalExpr(scope, e.expr);
    if (!a.isNumber(v)) {
        error(`Line ${e.line}: invalid operand type for '${e.op}': '${v.kind}'.`);
    }
    return a.number(v.value * fact);
}

// binopConcat<T>(scope: State, e: Expr): [f: (v: T) => Atom<T>, v1: T, v2: T]
const binopConcat = (scope, e) => {
    const e1 = evalExpr(scope, e.e1), e2 = evalExpr(scope, e.e2);
    // Check for string concatentation.
    if (a.areStrings(e1, e2)) {
        return [a.string, e1.value, e2.value];
    }
    if (!a.areNumbers(e1, e2)) {
        // Invalid operand types.
        error(`Line ${e.line}: invalid operand type(s) for '${e.op}': '${e1.kind}' and '${e2.kind}'.`);
    }
    return [a.number, e1.value, e2.value];

}

// binopNumeric(scope: State, e: Expr): [v1: Number, v2: Number]
const binopNumeric = (scope, e) => {
    const e1 = evalExpr(scope, e.e1), e2 = evalExpr(scope, e.e2);
    if (!a.areNumbers(e1, e2)) {
        error(`Line ${e.line}: invalid operand type(s) for '${e.op}': '${e1.kind}' and '${e2.kind}'.`);
    }
    return [e1.value, e2.value];

}

// binopBit(scope: State, e: Expr): [v1: Number, v2: Number]
const binopBit = (scope, e) => {
    const e1 = evalExpr(scope, e.e1), e2 = evalExpr(scope, e.e2);
    if (!a.areNumbers(e1, e2)) {
        error(`Line ${e.line}: invalid operand type(s) for '${e.op}': '${e1.kind}' and '${e2.kind}'.`);
    }
    if (!a.areIntegers(e1, e2)) {
        error(`Line ${e.line}: bit-wise '${e.op}' expected integer operands: Received '${e1.value}' and '${e2.value}'.`);
    }
    return [e1.value, e2.value];
}

// binopCmp<T>(scope: State, e: Expr): [e1: I, e2: T]
const binopCmp = (scope, e) => {
    const e1 = evalExpr(scope, e.e1), e2 = evalExpr(scope, e.e2);
    if ((!a.areNumbers(e1, e2)) && (!a.areStrings(e1, e2))) {
        error(`Line ${e.line}: invalid operand type(s) for '${e.op}': '${e1.kind}' and '${e2.kind}'.`);
    }
    return [e1.value, e2.value];
}
