const { runProgram, interpProgram, parseProgram } = require("../../src");
const { parseStatement } = require("../../src/parser/parse");

test('prefix fail', () => {
    const r = runProgram(' ++1; ');
    expect(r.kind).toBe('error');
});

test('unop bit not fail', () => {
    const r = runProgram(' ~1.1; ');
    expect(r.kind).toBe('error');
});

test('unop fail', () => {
    const r = runProgram(' +"word"; ');
    expect(r.kind).toBe('error');
});

test('binop concat fail', () => {
    const r = runProgram(' 1 + "w"; ');
    expect(r.kind).toBe('error');
});

test('binop numeric fail', () => {
    const r = runProgram(' 1 - "w"; ');
    expect(r.kind).toBe('error');
});

test('binop bit fail', () => {
    const r = runProgram(' 1 ^ 1.1; ');
    expect(r.kind).toBe('error');
});

test('binop comparison fail', () => {
    const r = runProgram(' 1 > "w"; ');
    expect(r.kind).toBe('error');
});

test('variable fail', () => {
    const r = interpProgram( { kind: 'ok', value: [parseStatement(' a; ')] });
    expect(r.kind).toBe('error');
});

test('attribute fail', () => {
    const r = runProgram(' (100).x; ');
    expect(r.kind).toBe('error');
});

test('subscriptor fail', () => {
    const r = runProgram(' (100)[5]; ');
    expect(r.kind).toBe('error');
});

test('string sub fail', () => {
    const r = runProgram(' "w"[0.1]; ');
    expect(r.kind).toBe('error');
});

test('string index fail', () => {
    const r = runProgram(' "w"[1]; ');
    expect(r.kind).toBe('error');
});

test('function call unknown', () => {
    const r = interpProgram( { kind: 'ok', value: [parseStatement(' foo(); ')] });
    expect(r.kind).toBe('error');
});

test('function call invalid', () => {
    const r = runProgram(' (1)(); ');
    expect(r.kind).toBe('error');
});

test('function call arg count fail', () => {
    const r = runProgram(' foo = (a, b) => a + b; foo(1); ');
    expect(r.kind).toBe('error');
});

test('function call recursion error', () => {
    const r = runProgram(' foo = () => foo(); foo(); ');
    expect(r.kind).toBe('error');
});

test('return outside function', () => {
    const r = runProgram(' return; ');
    expect(r.kind).toBe('error');
});

test('break outside loop', () => {
    const r = runProgram(' break; ');
    expect(r.kind).toBe('error');
});

test('continue outside loop', () => {
    const r = runProgram(' continue; ');
    expect(r.kind).toBe('error');
});

test('delete fail', () => {
    const r = runProgram(' delete 1; ');
    expect(r.kind).toBe('error');
});

test('delete must operate on a collection', () => {
    const r = runProgram(' delete "word"[1]; ');
    expect(r.kind).toBe('error');
});

test('delete needs an existing attribute', () => {
    const r = runProgram(' delete { 2: 1 }[1]; ');
    expect(r.kind).toBe('error');
});

test(' assignment fail', () => {
    const val = parseStatement('a = b = 1;');
    val.assignArr[1] = { kind: 'number', value: 1 };
    const r = interpProgram({ kind: 'ok', value: [ val ]});
    expect(r.kind).toBe('error');
});