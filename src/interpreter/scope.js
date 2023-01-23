"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

// Tracks if the program enters a loop or function.
const Flags = (inFunc, inLoop) => Object.freeze({ inFunc, inLoop });
exports.Flags = Flags;

// Stores a link to creating (parent) state, and current variable mapping.
// State(parent: State, value: Object, out: String[]): State
const State = (parent, value = new Map(), out = []) => Object.freeze({ parent, value, out });
exports.State = State;

// childState(scope: State): State
const childState = (scope) => State(scope, new Map(), scope.out);
exports.childState = childState;

// Stores a link to creating (parent) state, parameter names, function body, 
// and tracks most recently made call environment (State).
// Closure(parent: State, params: String[], body: Stmt[]): Closure
const Closure = (parent, params, body) => { 
    const env = [];
    return Object.freeze({ parent, params, body, env });
};
exports.Closure = Closure;

// Pushes new call environment and return it's (value) variable mapping.
// newEnv(func: Closure): Object
const newEnv = (func) => {
    const newState = childState(func.parent);
    func.env.push(newState);
    return newState.value;
}
exports.newEnv = newEnv;

// Return most recently made call environment.
// getEnv(func: Closure): State
const getEnv = (func) => func.env.pop();
exports.getEnv = getEnv;

// Finds a variable in it's resting state and returns it's value. Otherwise, returns null.
// findInScope<T>(state: State, name: string): T
const findInScope = (state, name) => {
    let currState = state, currVars; 
    while (currState) {
        currVars = currState.value;
        if (currVars.has(name)) {
            return currVars.get(name);
        }
        currState = currState.parent;
    }
    return null;
}
exports.findInScope = findInScope;

// Sets variable in it's resting state. Otherwise, sets variable in current state.
// setVariable<T>(state: State, name: string, val: T): void
const setVariable = (state, name, val) => {
    let currState = state, currVars;
    while (currState) {
        currVars = currState.value;
        if (currVars.has(name)) {
            currVars.set(name, val);
            return;
        }
        currState = currState.parent;
    }
    state.value.set(name, val);
}
exports.setVariable = setVariable;