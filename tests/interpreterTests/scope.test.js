const s = require('../../src/interpreter/scope');
const a = require('../../src/interpreter/atoms');

const toMap = (o) => new Map(Object.entries(o));

test('simple variable find', () =>  {
    let r = s.findInScope(s.State(null, toMap({ foo: a.number(1) })), 'foo');
    expect(r).toEqual(a.number(1));
});

test('simple variable find failure', () =>  {
    let r = s.findInScope(s.State(null, toMap({ foo: a.number(1) })), 'notFoo');
    expect(r).toEqual(null);
});

test('variable find more than one state', () =>  {
    let r = s.findInScope(s.State(s.State(null, toMap({ bar: a.number(2) })), toMap({ foo: a.number(1) })), 'bar');
    expect(r).toEqual(a.number(2));
});

test('variable find first occurence', () =>  {
    let r = s.findInScope(s.State(s.State(null, toMap({ foo: a.number(2) })), toMap({ foo: a.number(1) })), 'foo');
    expect(r).toEqual(a.number(1));
});

test('variable find deep state', () =>  {
    let r = s.findInScope(s.State(s.State(s.State(s.State(s.State(s.State(s.State(s.State(null), toMap({ foo: a.number(1)})))))))), 'foo');
    expect(r).toEqual(a.number(1));
});

test('simple variable set non-existing', () =>  {
    const state = s.State(null, toMap({}));
    s.setVariable(state, 'foo', a.number(2));
    expect(state.value.get('foo')).toEqual(a.number(2));
});

test('simple variable set existing', () =>  {
    const state = s.State(null, toMap({ foo: a.number(1) }));
    s.setVariable(state, 'foo', a.number(2));
    expect(state.value.get('foo')).toEqual(a.number(2));
});

test('variable set more than one state', () =>  {
    const state = s.State(s.State(null));
    s.setVariable(state, 'foo', a.number(1));
    // Parent state remains unchanged.
    expect(state.parent.value.get('foo')).toEqual(undefined);
    // Only current state is updated.
    expect(state.value.get('foo')).toEqual(a.number(1));
});

test('variable set first occurence', () =>  {
    const state = s.State(s.State(null, toMap({ foo: a.number(1) })), toMap({ foo: a.number(1) }));
    s.setVariable(state, 'foo', a.number(2));
    // parent state 'foo' value is unchanged.
    expect(state.parent.value.get('foo')).toEqual(a.number(1));
    // current state 'foo' is changed.
    expect(state.value.get('foo')).toEqual(a.number(2));
});

test('variable set deep state', () =>  {
    const state = s.State(s.State(s.State(s.State(s.State(s.State(s.State(s.State(null), toMap({ foo: a.number(1)}))))))));
    s.setVariable(state, 'foo', a.number(2));
    expect(state.parent.parent.parent.parent.parent.parent.value.get('foo')).toEqual(a.number(2));
});

test('child state creation', () => {
    const parent = s.State(null);
    const child = s.childState(parent);
    expect(child.out).toBe(parent.out);
});

test('closure creation', () => {
    const parent = s.State(null, toMap({ foo: a.number(1)}));
    const child = s.Closure(parent, null, null);
    expect(child.parent).toBe(parent);
});

test('simple closure environment', () => {
    const parent = s.State(null, toMap({ foo: a.number(1)}));
    const child = s.Closure(parent, null, null);
    s.newEnv(child);
    expect(s.getEnv(child).parent).toBe(parent);
});

test('closure environment more than one', () => {
    const parent = s.State(null, toMap({ foo: a.number(1)}));
    const child = s.Closure(parent, null, null);
    // Push two new call environments.
    s.newEnv(child);
    s.newEnv(child);
    // Both environments share the same parent state.
    expect(s.getEnv(child).parent).toBe(s.getEnv(child).parent);
    
});

