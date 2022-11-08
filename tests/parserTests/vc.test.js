const { parseProgram } = require("../../src/index");

test('define variables before use', () => {
    let r = parseProgram('x = x + 1');
    expect(r.kind).toBe('error');
});

test('compound assignments require defined variables', () => {
    let r = parseProgram('x += 1');
    expect(r.kind).toBe('error');
});

test('cannot use variables defined within other blocks', () => {
    let r = parseProgram('if (true) { x = 0; } else if(true) { x += 1; }');
    expect(r.kind).toBe('error');
    r = parseProgram('if (true) { x = 0; } else { x += 1; }');
    expect(r.kind).toBe('error');
    r = parseProgram('if (true) { x = 0; } while(true) { x += 1; }');
    expect(r.kind).toBe('error');
    r = parseProgram('if (true) { x = 0; } for(i = 0; i < true: ++i) { x += 1; }');
    expect(r.kind).toBe('error');
});

test('cannot use variables defined within blocks', () => {
    let r = parseProgram('if (true) { x = 0; } else if (true) { x = 1; ) else { x = 4; } while(true) { x = 0; } for(x = 0; x < true; x += 1) { x = 2; } x = x + 1;');
    expect(r.kind).toBe('error');
});

test('cannot use variables defined within closures', () => {
    let r = parseProgram('foo = () => { x = 0; }; x = x + 1;');
    expect(r.kind).toBe('error');
});

test('cannot use duplicate parameters', () => {
    let r = parseProgram('foo = (x, x) => { x = 0; };');
    expect(r.kind).toBe('error');
});

test('need brackets while', () => {
    let r = parseProgram(`while(1) x = 1; print(x);`)
    expect(r.kind).toBe('error')
})

test('need brackets for', () => {
    let r = parseProgram(`for(i = 0; true; ++i) x = 1; print(i);`)
    expect(r.kind).toBe('error')
})

test('for updates must be defined', () => {
    let r = parseProgram(`for(i = 0, 1; true; z = 0) x = 1;`)
    expect(r.kind).toBe('error')
})

test('override built-in functions', () => {
    let r = parseProgram('ord = 1; a = ord.a; b = ord[1];');
    expect(r.kind).toBe('ok');  
});

test('subscriptor expr', () => {
    let r = parseProgram('a = 1; a[b];');
    expect(r.kind).toBe('error');  
})

test('cannot delete non-attribute or subscriptor', () => {
    let r = parseProgram('del(1);')
    expect(r.kind).toBe('error')
});

test('cannot subscript built-in functions', () => {
    let r = parseProgram('a = ord["key"];');
    expect(r.kind).toBe('error');
});

test('cannot use none as attribute', () => {
    let r = parseProgram('a = { none: 1 };')
    expect(r.kind).toBe('error')
})

test('cannot subscript built-in functions', () => {
    let r = parseProgram('a = type.atr;');
    expect(r.kind).toBe('error');
});

test('can use variable names as closure parameters', () => {
    let r = parseProgram('x = 1; y = x => x;');
    expect(r.kind).toBe('ok');
});

test('can use out of scope variable names', () => {
    let r = parseProgram('x = 1; while(true) { x += 1; }');
    expect(r.kind).toBe('ok');
});

test('closure variables are defined', () => {
    let r = parseProgram('a = () => a;');
    expect(r.kind).toBe('ok')
});

test('closure attribute variables are defined', () => {
    let r = parseProgram('a = { b: () => a };');
    expect(r.kind).toBe('ok')
});

test('closure attribute variables must be defined', () => {
    let r = parseProgram('a = { b: () => b };');
    expect(r.kind).toBe('error');
});