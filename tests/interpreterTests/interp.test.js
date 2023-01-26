const p = require("../../src/parser/parse.js");
const i = require("../../src/interpreter/interp.js");
const a = require("../../src/interpreter/atoms.js");
const s = require('../../src/interpreter/scope');

const toMap = (o) => new Map(Object.entries(o));

// Primitive tests

test('none atom', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' none '));
    expect(r).toEqual(a.none(null));
});

test('boolean atom', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' true '));
    expect(r).toEqual(a.boolean(true));
});

test('number atom', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' 1 '));
    expect(r).toEqual(a.number(1));
});

test('string atom', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(" 'word' "));
    expect(r).toEqual(a.string('word'));
});

test('Infinity test', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' -Infinity '));
    expect(r).toEqual(a.number(-Infinity));
});

// Expression tests

test('variable test', () => {
    const r = i.evalExpr(s.State(null, toMap({ 'x': a.number(1)})), p.parseExpression(' x '));
    expect(r).toEqual(a.number(1));
});

test('collection test', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' { a: 1} '));
    expect(r).toEqual(a.collection(toMap({ a: a.number(1) })));
});

test('collection nested test', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' { a: { b: 1, c: 2} } '));
    expect(r).toEqual(a.collection(toMap({ a: a.collection(toMap({ b: a.number(1), c: a.number(2) }))})));
});

test('simple closure test', () => {
    const top = s.State(null);
    const r = i.evalExpr(top, p.parseExpression(' (b, a) => 1 '));
    expect(r.value.parent).toEqual(top);
    expect(r.value.params).toEqual(['b', 'a']);
    expect(r.value.body).toEqual([{ kind: 'return', expr: { kind: 'number', value: 1, line: 1 }, line: 1 }]);
});

test('logical not', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('!1'));
    expect(r).toEqual(a.boolean(false));
});

test('bit not', () => {
    const r = i.evalExpr(s.State(null, toMap({ 'x': a.number(0)})), p.parseExpression('~x'));
    expect(r).toEqual(a.number(-1));
});

test('pre-increment', () => {
    const top = s.State(null, toMap({ x : a.boolean(true)}));
    const r = i.evalExpr(top, p.parseExpression('++x'));
    // returned value.
    expect(r).toEqual(a.number(2));
    // variable value.
    expect(top.value.get('x')).toEqual(a.number(2));
});

test('pre-decrement', () => {
    const top = s.State(null, toMap({ x : a.boolean(true)}));
    const r = i.evalExpr(top, p.parseExpression('--x'));
    // returned value.
    expect(r).toEqual(a.number(0));
    // variable value.
    expect(top.value.get('x')).toEqual(a.number(0));
});

test('unary plus', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('+1'));
    expect(r).toEqual(a.number(1));
});

test('unary minus', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('-1'));
    expect(r).toEqual(a.number(-1));
});

test('logical and simple', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' true && 1 '));
    expect(r).toEqual(a.number(1));
});

test('logical and short circuit', () => {
    const r = i.evalExpr(s.State(null), { kind: 'binop', op: '&&', e1: { kind: 'boolean', value: false }, e2: null });
    expect(r).toEqual(a.boolean(false));
});

test('logical or simple', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' "" || "non-empty" '));
    expect(r).toEqual(a.string("non-empty"));
});

test('logical or short circuit', () => {
    const r = i.evalExpr(s.State(null), { kind: 'binop', op: '||', e1: { kind: 'boolean', value: true }, e2: null });
    expect(r).toEqual(a.boolean(true));
});

test('addition integers', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('1 + 1'));
    expect(r).toEqual(a.number(2));
});

test('string concat', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression("'foo' + 'bar'"));
    expect(r).toEqual(a.string('foobar'));
});

test('subtraction', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('1.5 - 1.5'));
    expect(r).toEqual(a.number(0));
});
test('multiplication', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('2 * 3'));
    expect(r).toEqual(a.number(6));
});
test('division', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('3 / 2'));
    expect(r).toEqual(a.number(1.5));
});

test('floor division', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('3 // 2'));
    expect(r).toEqual(a.number(1));
});
test('modulo integers', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('4 % 3'));
    expect(r).toEqual(a.number(1));
});

test('left shift', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('2 << 1'));
    expect(r).toEqual(a.number(4));
});

test('right shift', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('8 >> 1'));
    expect(r).toEqual(a.number(4));
});

test('bit and', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('3 & 1'));
    expect(r).toEqual(a.number(1));
});

test('bit or', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('3 | 1'));
    expect(r).toEqual(a.number(3));
});

test('equality false', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('0 == 1'));
    expect(r).toEqual(a.boolean(false));
});

test('equality true', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('1 == 1'));
    expect(r).toEqual(a.boolean(true));
});

test('non-equality true', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('0 != 1'));
    expect(r).toEqual(a.boolean(true));
});

test('non-equality false', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('1 != 1'));
    expect(r).toEqual(a.boolean(false));
});

test('compare less than', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('1 < 0'));
    expect(r).toEqual(a.boolean(false));
});

test('compare greater than', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('1 > 0'));
    expect(r).toEqual(a.boolean(true));
});

test('compare less than equal to', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('1 <= 1'));
    expect(r).toEqual(a.boolean(true));
});

test('compare greater than equal to', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('0 >= 1'));
    expect(r).toEqual(a.boolean(false));
});

test('arithmetic chain', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression('1 + 2 - 3 * 4 / 4'));
    expect(r).toEqual(a.number(0));
});

test('attribute simple', () => {
    const r = i.evalExpr(s.State(null, toMap({ x : a.collection(toMap({ a: a.number(1) })) })), p.parseExpression(' x.a '))
    expect(r).toEqual(a.number(1));
});

test('attribute increment', () => {
    const top = s.State(null, toMap({ x : a.collection(toMap({ a: a.number(1) })) }));
    const r = i.evalExpr(top, p.parseExpression(' ++x.a '))
    // returned value
    expect(r).toEqual(a.number(2));
    // value changes in memory.
    expect(top.value.get('x').value.get('a')).toEqual(a.number(2));
});

test('attribute increment', () => {
    const top = s.State(null, toMap({ x : a.collection(toMap({ '1': a.number(1) })) }));
    const r = i.evalExpr(top, p.parseExpression(' ++x[1] '))
    // returned value
    expect(r).toEqual(a.number(2));
    // value changes in memory.
    expect(top.value.get('x').value.get('1')).toEqual(a.number(2));
});

test('attribute nested', () => {
    const r = i.evalExpr(s.State(null, toMap({ x : a.collection(toMap({ a: a.collection(toMap({ b: a.number(1) })) }))})), p.parseExpression('x.a.b'))
    expect(r).toEqual(a.number(1));
});

test('attribute in-place', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' { a: 1}.a '))
    expect(r).toEqual(a.number(1));
});

test('subscriptor simple', () => {
    const r = i.evalExpr(s.State(null, toMap({ x : a.collection(toMap({ '1': a.number(1) })) })), p.parseExpression(' x[1] '))
    expect(r).toEqual(a.number(1));
});

test('subscriptor non-existent', () => {
    const r = i.evalExpr(s.State(null, toMap({ x : a.collection(toMap({})) })), p.parseExpression(' x[1] '))
    expect(r).toEqual(a.none(null));
});

test('subscriptor in-place', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' { 1: 1}[1] '))
    expect(r).toEqual(a.number(1));
});

test('subscriptor string', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' "word"[1] '))
    expect(r).toEqual(a.string('o'));
});

test('ternary trueExpr', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' true ? "foo" : "bar" '))
    expect(r).toEqual(a.string('foo'));
});

test('ternary short ciruit', () => {
    const r = i.evalExpr(s.State(null), {kind: 'ternary', test: { kind: 'boolean', value: false }, trueExpr: null, falseExpr: { kind: 'number', value: 5 } });
    expect(r).toEqual(a.number(5));
});

test('ternary falseExpr', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' none ? "foo" : "bar" '))
    expect(r).toEqual(a.string('bar'));
});

test('call simple', () => {
    const r = i.evalBlock(s.State(null), p.parseProgram('x = () => 1; return x();').value, s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(1) });
});

test('tracks only enumerable properties', () => {
    const r = i.evalBlock(s.State(null), p.parseProgram('toString = () => 1; if (true){ return toString(); }').value, s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(1) });
});

test('call in-place', () => {
    const r = i.evalBlock(s.State(null), p.parseProgram('return (() => 1)();').value, s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(1) });
});

test('call one argument', () => {
    const r = i.evalBlock(s.State(null), p.parseProgram('x = (a) => a; return x(1);').value, s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(1) });
});

test('call arguments override global variables', () => {
    const r = i.evalBlock(s.State(null), p.parseProgram('a = -1; x = (a) => a; return x(1);').value, s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(1) });
});

test('call more than one argument', () => {
    const r = i.evalBlock(s.State(null), p.parseProgram('x = (a, b) => a + b; return x(2, 3);').value, s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(5) });
});

test('call recursive', () => {
    const r = i.evalBlock(s.State(null), p.parseProgram('x = (a) => a < 100 ? x(a + 1) : a; return x(0);').value, s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(100) });
});

test('call curry', () => {
    const r = i.evalBlock(s.State(null), p.parseProgram('x = a => b => c => a + b + c; return x(1)(2)(3);').value, s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(6) });
});

test('call closure simple', () => {
    const r = i.evalBlock(s.State(null), p.parseProgram('x = a => () => ++a; b = x(0); return b() + b();').value, s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(3) });
});

test('recursive closure creation', () => {
    const r = i.evalBlock(s.State(null), p.parseProgram('x = (v , n) => { val: () => v, next: () => n }; list = x(-5, x(5, none)); return list.val() + list.next().val();').value, s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(0) });
});

// Built-in function tests.

test('type number', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' type(1) '));
    expect(r).toEqual(a.string('number'));
});

test('len string', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' len("word") '));
    expect(r).toEqual(a.number(4));
});

test('len collection', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' len({ x: 1, y: 1, z: 1 }) '));
    expect(r).toEqual(a.number(3));
});

test('built-in ord', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' ord("a") '));
    expect(r).toEqual(a.number(97));
});

test('built-in abs', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' abs(-1) '));
    expect(r).toEqual(a.number(1));
});

test('built-in pow', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' pow(2, 11) '));
    expect(r).toEqual(a.number(2048));
});

test('built-in bool', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' bool("") '));
    expect(r).toEqual(a.boolean(false));
});

test('built-in num string', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' num("1235412.56") '));
    expect(r).toEqual(a.number(1235412.56));
});

test('built-in num bool', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' num(true) '));
    expect(r).toEqual(a.number(1));
});

test('built-in str', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' str(1) '));
    expect(r).toEqual(a.string("1"));
});

test('built-in str none', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' str(none) '));
    expect(r).toEqual(a.string("none"));
});

test('built-in str collection simple', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' str({ a: 1}) '));
    expect(r).toEqual(a.string("{ a: 1 }"));
});

test('built-in str collection more than one', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' str({ a: 1, b: 2 }) '));
    expect(r).toEqual(a.string("{ a: 1, b: 2 }"));
});

test('built-in str collection nested', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(` str({ a: "1", b: { x: '2', y: 3 } }) `));
    expect(r).toEqual(a.string(`{ a: '1', b: { x: '2', y: 3 } }`));
});

test('built-in str closure', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' str(() => 1) '));
    expect(r).toEqual(a.string("<Closure>"));
});

test('built-in keys', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' keys({ a : 1, b : 2, c : 3}) '));
    expect(r).toEqual(a.collection(toMap({ '0': a.string('a'), '1': a.string('b'), '2': a.string('c')  })));
});

test('built-in keys empty', () => {
    const r = i.evalExpr(s.State(null), p.parseExpression(' keys({}) '));
    expect(r).toEqual(a.collection(toMap({})));
});

test('built-in print empty', () => {
    const top = s.State(null);
    i.evalStmt(top, p.parseStatement(' print(); '));
    expect(top.out).toEqual(['\n']);
});

test('built-in print simple', () => {
    const top = s.State(null);
    i.evalStmt(top, p.parseStatement(' print(1); '));
    expect(top.out).toEqual(['1', ' ', '\n']);
});

test('built-in print new state', () => {
    const top = s.State(null);
    i.evalBlock(top, p.parseProgram(' print(1); if (true) { print(2); }').value, s.Flags(false, false) );
    expect(top.out).toEqual(['1', ' ', '\n', '2', ' ', '\n']);
});

test('built-in print more than one argument', () => {
    const top = s.State(null);
    i.evalStmt(top, p.parseStatement(' print(1, 2, 3); '));
    expect(top.out).toEqual(['1', ' ', '2', ' ', '3', ' ', '\n']);
});

test('built-in print more than one', () => {
    const top = s.State(null);
    i.evalBlock(top, p.parseProgram(' print(1); print(2);').value, s.Flags(false, false) );
    expect(top.out).toEqual(['1', ' ', '\n', '2', ' ', '\n']);
});

test('named functions override built-in functions', () => {
    const top = s.State(null);
    i.evalBlock(top, p.parseProgram(' print = (a) => a; print(1); ').value, s.Flags(false, false) );
    expect(top.out).toEqual([]);
});

// Statement tests.

test('static test', () => {
    const r = i.evalStmt(s.State(null), p.parseStatement(' 1; '));
    expect(r).toEqual({ kind: 'static', stop: false, value: a.number(1) });
});

test('return statement', () => {
    const r = i.evalStmt(s.State(null), p.parseStatement(' return 1; '), s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(1) });
});

test('break statement', () => {
    const r = i.evalStmt(s.State(null), p.parseStatement(' break; '), s.Flags(false, true));
    expect(r).toEqual({ kind: 'break', stop: true, value: a.none(null) });
});

test('continue statement value', () => {
    const r = i.evalStmt(s.State(null), p.parseStatement('continue;'), s.Flags(false, true));
    expect(r).toEqual({ kind: 'continue', stop: true, value: a.none(null)  });
});

test('delete statement value', () => {
    const top = s.State(null, toMap({ x: a.collection(toMap({ '1': a.number(1) })) }));
    const r = i.evalStmt(top, p.parseStatement(' delete x[1]; '));
    expect(r).toEqual({ kind: 'delete', stop: false, value: a.none(null)  });
});

test('delete statement attr', () => {
    const top = s.State(null, toMap({ x: a.collection(toMap({ a: a.number(1) })) }));
    i.evalStmt(top, p.parseStatement(' delete x.a; '));
    expect(top.value.get('x').value.get('a')).toEqual(undefined);
});

test('delete statement nested', () => {
    const top = s.State(null, toMap({ x: a.collection(toMap({ y: a.collection(toMap({ z: a.number(1) }))  })) }));
    i.evalStmt(top, p.parseStatement(' delete x.y.z; '));
    expect(top.value.get('x').value.get('y').value.get('z')).toEqual(undefined);
});
test('delete statement sub', () => {
    const top = s.State(null, toMap({ x: a.collection(toMap({ '1': a.number(1) })) }));
    i.evalStmt(top, p.parseStatement(' delete x[1]; '));
    expect(top.value.get('x').value.get('1')).toEqual(undefined);
});

test('assignment statement value', () => {
    const top = s.State(null, toMap({ x: a.collection(toMap({}) )}));
    const r = i.evalStmt(top, p.parseStatement(' a = 1; '));
    expect(r).toEqual({ kind: 'assignment', stop: false, value: a.number(1) });
});

test('assignment statement simple', () => {
    const top = s.State(null);
    i.evalStmt(top, p.parseStatement(' x = 1; '));
    expect(top.value.get('x')).toEqual(a.number(1));
});

test('assignment statement chain', () => {
    const top = s.State(null);
    i.evalStmt(top, p.parseStatement(' x = y = z = 1; '));
    expect(top.value.get('x')).toEqual(a.number(1));
    expect(top.value.get('y')).toEqual(a.number(1));
    expect(top.value.get('z')).toEqual(a.number(1));
});

test('assignment statement attribute', () => {
    const top = s.State(null, toMap({ x: a.collection(toMap({}) )}));
    i.evalStmt(top, p.parseStatement(' x.a = 1; '));
    expect(top.value.get('x').value.get('a')).toEqual(a.number(1));
});

test('assignment statement sub', () => {
    const top = s.State(null, toMap({ x: a.collection(toMap({}) )}));
    i.evalStmt(top, p.parseStatement(' x[1] = 1; '));
    expect(top.value.get('x').value.get('1')).toEqual(a.number(1));
});

test('assignment statement nested', () => {
    const top = s.State(null, toMap({ x: a.collection(toMap({ y: a.collection(toMap({})  )})) }));
    i.evalStmt(top, p.parseStatement(' x.y.z = 1; '));
    expect(top.value.get('x').value.get('y').value.get('z')).toEqual(a.number(1));
});

test('if statement simple', () => {
    const top = s.State(null, toMap({ x: a.none(null) }));
    i.evalStmt(top, p.parseStatement(' if (true) { x = 1; } '));
    expect(top.value.get('x')).toEqual(a.number(1));
});

test('if return', () => {
    const top = s.State(null, toMap({ x: a.none(null) }));
    const r = i.evalStmt(top, p.parseStatement(' if (true) { x = 1; return x; } '), s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(1) });
});

test('if break', () => {
    const top = s.State(null, toMap({ x: a.none(null) }));
    const r = i.evalStmt(top, p.parseStatement(' if (true) { x = 1; break; } '), s.Flags(false, true));
    expect(r).toEqual({ kind: 'break', stop: true, value: a.none(null)  });
});

test('if continue', () => {
    const top = s.State(null, toMap({ x: a.none(null) }));
    const r = i.evalStmt(top, p.parseStatement(' if (true) { x = 1; continue; } '), s.Flags(false, true));
    expect(r).toEqual({ kind: 'continue', stop: true, value: a.none(null)  });
});

test('if else statement', () => {
    const top = s.State(null, toMap({ x: a.none(null) }));
    i.evalStmt(top, p.parseStatement(' if (false) { x = 1; } else { x = -1; } '));
    expect(top.value.get('x')).toEqual(a.number(-1));
});

test('if elif statement', () => {
    const top = s.State(null, toMap({ x: a.none(null) }));
    i.evalStmt(top, p.parseStatement(' if (false) { x = 1; } elif (true) { x = -1; } '));
    expect(top.value.get('x')).toEqual(a.number(-1));
});

test('if elif else statement', () => {
    const top = s.State(null, toMap({ x: a.none(null) }));
    i.evalStmt(top, p.parseStatement(' if (false) { x = 1; } elif (false) { x = 2; } else { x = -1; } '));
    expect(top.value.get('x')).toEqual(a.number(-1));
});

test('while statement', () => {
    const top = s.State(null, toMap({ x: a.number(0) }));
    i.evalStmt(top, p.parseStatement(' while (x < 10) { ++x; }'));
    expect(top.value.get('x')).toEqual(a.number(10));
});

test('while statement return', () => {
    const top = s.State(null, toMap({ x: a.number(0) }));
    const r = i.evalStmt(top, p.parseStatement(' while (x < 10) { return ++x; }'), s.Flags(true, false));
    expect(r).toEqual({ kind: 'return', stop: true, value: a.number(1) });
});

test('while statement break simple', () => {
    const top = s.State(null, toMap({ x: a.number(0) }));
    i.evalStmt(top, p.parseStatement(' while (x < 10) { break; ++x; }'));
    expect(top.value.get('x')).toEqual(a.number(0));
});

test('while statement break nested', () => {
    const top = s.State(null, toMap({ x: a.number(0) }));
    i.evalStmt(top, p.parseStatement(' while (x < 10) { while(true) break; ++x; }'));
    expect(top.value.get('x')).toEqual(a.number(10));
});

test('while statement continue', () => {
    const top = s.State(null, toMap({ x: a.number(0) }));
    i.evalStmt(top, p.parseStatement(' while (x < 10) { ++x; continue; break; }'));
    expect(top.value.get('x')).toEqual(a.number(10));
});

test('for statement simple', () => {
    const top = s.State(null, toMap({ x: a.number(0) }));
    i.evalStmt(top, p.parseStatement('for(i = 0; i < 10; ++i) { x = i; }'));
    expect(top.value.get('x')).toEqual(a.number(9));
    // i does not exist on top state.
    expect(top.value.get('i')).toEqual(undefined);
});

test('for statement return', () => {
    const top = s.State(null, toMap({ x: a.number(0) }));
    i.evalStmt(top, p.parseStatement('for(i = 0; i < 10; ++i) { return i; x = i;}'), s.Flags(true, false));
    expect(top.value.get('x')).toEqual(a.number(0));
});

test('for statement break', () => {
    const top = s.State(null, toMap({ x: a.number(0) }));
    i.evalStmt(top, p.parseStatement('for(i = 0; i < 10; ++i) { break; x = i; }'));
    expect(top.value.get('x')).toEqual(a.number(0));
});

test('for statement break nested', () => {
    const top = s.State(null, toMap({ x: a.number(0) }));
    i.evalStmt(top, p.parseStatement('for(i = 0; i < 10; ++i) { for(j = 0; true; ++j) break; x = i; }'));
    expect(top.value.get('x')).toEqual(a.number(9));
});

test('for statement continue', () => {
    const top = s.State(null, toMap({ x: a.number(0) }));
    i.evalStmt(top, p.parseStatement('for(i = 0; i < 10; ++i) { x = i; continue; --i; }'));
    expect(top.value.get('x')).toEqual(a.number(9));
});

test('last value in block', () => {
    const r = i.evalStmt(s.State(null), p.parseStatement('if (true) { 1; 2; }'));
    expect(r).toEqual({ kind: 'static', stop: false, value: a.number(2)});
});

test('last value in while block', () => {
    const r = i.evalStmt(s.State(null, toMap({ x: a.number(0) })), p.parseStatement('while (x < 1) { ++x; 1; }'));
    expect(r).toEqual({ kind: 'static', stop: false, value: a.number(1)});
});

test('last value in for block', () => {
    const r = i.evalStmt(s.State(null, toMap({ x: a.number(0) })), p.parseStatement('for (i = 0; i < 1; ++i) { 2; }'));
    expect(r).toEqual({ kind: 'static', stop: false, value: a.number(2)});
});

test('last value in block empty', () => {
    const r = i.evalStmt(s.State(null), p.parseStatement('if (true) { } '));
    expect(r).toEqual({ kind: 'empty', stop: false, value: a.none(null) });
});

test('last value in program', () => {
    const r = i.interpProgram(p.parseProgram('x = 1; x = 2;'));
    expect(r.last).toEqual('2');
});

test('program vars', () => {
    const r = i.interpProgram(p.parseProgram('a = 1; b = 2;'));
    expect(r.vars).toEqual(toMap({ a: a.number(1), b: a.number(2) }));
});

test('program updates old vars', () => {
    const m = toMap({ a: a.number(1) })
    const r = i.interpProgram(p.parseProgram('a += 1;', m), m);
    expect(r.vars).toEqual(toMap({ a: a.number(2) }));
});
