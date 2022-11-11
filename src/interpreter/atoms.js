"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

// Freezes argument object.
const Atom = n => Object.freeze(n);

// Atoms.
const none = (value) => {
    return Atom({ kind: 'none', value });
}
exports.none = none;
const boolean = (value) => {
    return Atom({ kind: 'boolean', value });
}
exports.boolean = boolean;
const number = (value) => {
    return Atom({ kind: 'number', value });
}
exports.number = number;
const string = (value) => {
    return Atom({ kind: 'string', value });
}
exports.string = string;
const closure = (value) => {
    return Atom({ kind: 'closure', value });
}
exports.closure = closure;
const collection = (value) => {
    return Atom({ kind: 'collection', value });
}
exports.collection = collection

// formatCollection(v: Atom): String
const formatCollection = (c) => {
    let length = c.value.size - 1;
    const strCollec = [];
    strCollec.push("{ ");
    for(const [k, v] of c.value) {
        const pairStr = `${k}: ${ isString(v) ? `'${v.value}'` : strRep(v) }`;
        strCollec.push(pairStr);
        if (0 < length--) {
            strCollec.push(', ');
        }
    }
    strCollec.push(" }");
    return strCollec.join("");
};

// strRep(v: Atom): String
const strRep = (v) => {
    switch(v.kind) {
        case 'none': { return 'none';}
        case 'collection': { return formatCollection(v); }
        case 'closure': { return "<Closure>"; }
        default: { return String(v.value) }
    }
}
exports.strRep = strRep;

// isNumber(v: Atom): Boolean
const isNumber = (v) => {
    const kind = v.kind;
    return kind === 'number' || kind === 'boolean';
}
exports.isNumber = isNumber;

// areNumbers(v1: Atom, v2: Atom): Boolean
const areNumbers = (v1, v2) => {
    return isNumber(v1) && isNumber(v2);
}
exports.areNumbers = areNumbers;

// isInteger(v: Atom): Boolean
const isInteger = (v) => {
    return isNumber(v) && Number.isInteger(v.value);
}
exports.isInteger = isInteger;

// areIntegers(v1: Atom, v2: Atom): Boolean
const areIntegers = (v1, v2) => {
    return isInteger(v1) && isInteger(v2);
}
exports.areIntegers = areIntegers;

// isString(v: Atom): Boolean
const isString = (v) => {
    return v.kind === 'string';
}
exports.isString = isString;

// areStrings(v1: Atom, v2: Atom): Boolean
const areStrings = (v1, v2) => {
    return isString(v1) && isString(v2);
}
exports.areStrings = areStrings;

// isAttribute(v: Atom): Boolean
const isAttribute = (e) => {
    return e.kind === 'attribute';
}
exports.isAttribute = isAttribute;

// isSubscriptor(v: Atom): Boolean
const isSubscriptor = (e) => {
    return e.kind === 'subscriptor';
}
exports.isSubscriptor = isSubscriptor;

// isCollection(v: Atom): Boolean
const isCollection = (v) => {
    return v.kind === 'collection';
}
exports.isCollection = isCollection;

// isCollection(v: Atom): Boolean
const isClosure = (v) => {
    return v.kind === 'closure';
}
exports.isClosure = isClosure;

// validAttribute(v: Atom): Boolean
const validAttribute = (v) => {
    const kind = v.kind;
    return kind !== 'collection' && kind !== 'closure';
};
exports.validAttribute = validAttribute;
