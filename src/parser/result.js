"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

function unreachable(message) {
    throw new Error(message);
}
exports.unreachable = unreachable;
class OK {
    constructor(value) {
        this.value = value;
        this.kind = 'ok';
    }
    getKind() {
        return this.kind;
    }
    unsafeGet() {
        return this.value;
    }
    then(other) {
        return other(this.value);
    }
    map(f) {
        return new OK(f(this.value));
    }
}
class Error {
    constructor(message) {
        this.message = message;
        this.kind = 'error';
    }
    getKind() {
        return this.kind;
    }
    unsafeGet() {
        throw new Error(`Called unsafeGet on Error(${this.message})`);
    }
    then(other) {
        return this;
    }
    map(f) {
        return this;
    }
}
function ok(value) {
    return new OK(value);
}
exports.ok = ok;
function error(message) {
    return new Error(message);
}
exports.error = error;
function foldLeft(f, init, array) {
    let acc = init;
    for (const c of array) {
        let r = f(acc, c);
        if (r.getKind() === 'error') {
            return r;
        }
        acc = r.value;
    }
    return ok(acc);
}
exports.foldLeft = foldLeft;

function foldLeftNoAcc(f, init, array) {
    for (const c of array) {
        let r = f(init, c);
        if (r.getKind() === 'error') {
            return r;
        }
    }
    return ok(init);
}
exports.foldLeftNoAcc = foldLeftNoAcc;