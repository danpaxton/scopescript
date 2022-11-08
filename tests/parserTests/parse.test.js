const { parseProgram } = require("../../src/index");
const a = require("../../src/parser/ast.js");

test('basic comment', () => {
    let r = parseProgram(`#comment with whitspace 134p43p109][];[[]//.''""'fds'\n x = 23;`)
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 2)], a.number('23', 2))
    ]);
});

test('comment mid assignment', () => {
    let r = parseProgram(`x = #fkals;df//ja;slkdfjlasdf\n 23;`)
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.number('23', 2))
    ]);
});

test('comment complicated', () => {
    let r = parseProgram(`#asd;lf\n for#;lkasdnf\n(i #lkad\n = 0; i < #lkasdnf\n 1; ++#agasasdg\ni) {
        #alskdfna 11\n #/alsfljkhadf\n1; }`)
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.for_([a.assignment([a.identifier('i', 3)], a.number('0', 4))], a.binop('<', a.variable('i', 4), 
            a.number('1', 5), 4), [a.static_(a.unop('++', a.variable('i', 6), 5))], [a.static_(a.number('1', 9))])
    ]);
});

test('assignment', () => {
    let r = parseProgram('x = 23;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.number('23', 1))
    ]);
});

test('re-assignment', () => {
    let r = parseProgram('x = 1; x = x + 1;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.number('1', 1)),
        a.assignment([a.identifier('x', 1)], a.binop('+', a.variable('x', 1), a.number('1', 1), 1))

    ]);
});

test('compound assignment 1 char op', () => {
    let r = parseProgram('x = 0; x += 1;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([ a.assignment([a.identifier('x', 1)], a.number('0', 1)),
        a.assignment([a.identifier('x', 1)], a.binop('+', a.variable('x', 1) , a.number('1', 1), 1), 1)
    ]);
});

test('compound assignment 2 char op', () => {
    let r = parseProgram('x = 0; x //= 1;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([ a.assignment([a.identifier('x', 1)], a.number('0', 1)),
        a.assignment([a.identifier('x', 1)], a.binop('//', a.variable('x', 1) , a.number('1', 1), 1), 1)
    ]);
});

test('assignment chain', () => {
    let r = parseProgram('x = y = z = i = j = 5;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1), a.identifier('y', 1), a.identifier('z', 1), a.identifier('i', 1), a.identifier('j', 1)], a.number('5', 1))
    ]);
});


test('cannot mix basic and compound assignments', () => {
    let r = parseProgram('x = 0; b = x += 1;');
    expect(r.kind).toBe('error');
});

test('if', () => {
    let r = parseProgram('x = 10; if (x) { x = 2; }');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.number('10', 1)),
        a.if_([{test: a.variable('x', 1), part: [a.assignment([a.identifier('x', 1)], a.number('2', 1))] }], [])
    ]);
});

test('if else', () => {
    let r = parseProgram('x = 10; if (x) {x = 2;} else {x = 4;}');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.number('10', 1)),
        a.if_([ {test: a.variable('x', 1), part: [a.assignment([a.identifier('x', 1)], a.number('2', 1))] } ],
        [a.assignment([a.identifier('x', 1)], a.number('4', 1))] )
    ]);
});


test('if else if, no else', () => {
    let r = parseProgram('x = 10; if (x) {x = 2;} else if(x) { x = 4; }');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.number('10', 1)),
        a.if_([{test: a.variable('x', 1), part: [a.assignment([a.identifier('x', 1)], a.number('2', 1))] },
                {test: a.variable('x', 1), part: [a.assignment([a.identifier('x', 1)], a.number('4', 1))] } ], [])
    ]);
});

test('if else if else', () => {
    let r = parseProgram('x = 10; if (x) { x = 2; } else if(x) { x = 8; } else if(x) { x = 4; } else { x = 1; }');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.number('10', 1)),
        a.if_([{test: a.variable('x', 1), part: [a.assignment([a.identifier('x', 1)], a.number('2', 1))] },
                {test: a.variable('x', 1), part: [a.assignment([a.identifier('x', 1)], a.number('8', 1))] },
                {test: a.variable('x', 1), part: [a.assignment([a.identifier('x', 1)], a.number('4', 1))] } ],
                [a.assignment([a.identifier('x', 1)], a.number('1', 1))])
    ]);
});

test('need if before else if', () => {
    let r = parseProgram('x = 10; else if(x) { x = 1; }');
    expect(r.kind).toBe('error');
});

test('need if before else', () => {
    let r = parseProgram('x = 10; else { x = 1; }');
    expect(r.kind).toBe('error');
});

test('if no brackets', () => {
    let r = parseProgram('if (1) 1; else if(1) 1; else 1;')
    expect(r.kind).toBe('ok')
    expect(r.unsafeGet()).toEqual([
        a.if_([{test: a.number('1', 1), part: [a.static_(a.number('1', 1))] },
                {test: a.number('1', 1), part: [a.static_(a.number('1', 1))] }],
                [a.static_(a.number('1', 1))]
    )]);
})

test('while', () => {
    let r = parseProgram('x = 10; while(x) { x = 2; }');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.number('10', 1)),
        a.while_(a.variable('x', 1), [a.assignment([a.identifier('x', 1)], a.number('2', 1))])
    ]);
});

test('while needs condition', () => {
    let r = parseProgram('x = 10; while () { x = 2; }');
    expect(r.kind).toBe('error');
});

test('while no bracket', () => {
    let r = parseProgram('while(1) 1;')
    expect(r.kind).toBe('ok')
    expect(r.unsafeGet()).toEqual([
        a.while_(a.number('1', 1), [a.static_(a.number('1', 1))])
    ]);
})

test('for simple', () => {
    let r = parseProgram('for (x = 0; x < true; ++x, 1) { x = 3; }');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.for_([a.assignment([a.identifier('x', 1)], a.number('0', 1))], a.binop('<', a.variable('x', 1), 
            a.bool(true, 1), 1), [a.static_(a.unop('++', a.variable('x', 1), 1)), a.static_(a.number('1', 1))], [a.assignment([a.identifier('x', 1)], a.number('3', 1))])
    ]);
});

test('for complicated', () => {
    let r = parseProgram('x = 10; for (x = y = z = 15, i = 0; i < true; ++i, y += 1, z = 0) { x = y; }');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.number('10', 1)),
        a.for_([a.assignment([a.identifier('x', 1), a.identifier('y', 1), a.identifier('z', 1)], a.number('15', 1)), a.assignment([a.identifier('i', 1)], a.number('0', 1))]
        , a.binop('<', a.variable('i', 1), a.bool(true, 1), 1), [a.static_(a.unop('++', a.variable('i', 1), 1)), 
        a.assignment([a.identifier('y', 1)], a.binop('+', a.variable('y', 1), a.number('1', 1), 1)),
        a.assignment([a.identifier('z', 1)], a.number('0', 1))], [a.assignment([a.identifier('x', 1)], a.variable('y', 1))])
    ]);
});

test('for needs init part', () => {
    let r = parseProgram('x = 10; for( ; 1 < true; 1) { x = 1; }');
    expect(r.kind).toBe('error');
});

test('for needs condition part', () => {
    let r = parseProgram('x = 10; for (x = 0; ; ++x) { x = 1; }');
    expect(r.kind).toBe('error');
});

test('for needs update part', () => {
    let r = parseProgram('x = 10; for (x = 0; x < true; ) { x = 1; }');
    expect(r.kind).toBe('error');
});


test('for no brackets', () => {
    let r = parseProgram(`for(i = 0; i < 10; ++i) i;`)
    expect(r.kind).toBe('ok')
    expect(r.unsafeGet()).toEqual([
        a.for_([a.assignment([a.identifier('i', 1)], a.number('0', 1))], a.binop('<', a.variable('i', 1), 
            a.number('10', 1), 1), [a.static_(a.unop('++', a.variable('i', 1), 1))], [a.static_(a.variable('i', 1))])
    ]);
})

test('delete subscriptor', () => {
    let r =  parseProgram("a = 1; delete(a[1]);");
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('a', 1)], a.number('1', 1)),
        a.delete_(a.subscriptor(a.variable('a', 1), a.number('1', 1), 1), 1)
    ]);
})

test('delete needs space', () => {
    let r =  parseProgram("a = 1; deletea[1];");
    expect(r.kind).toBe('error');
})

test('delete attribute', () => {
    let r =  parseProgram("a = 1; delete a.a;");
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('a', 1)], a.number('1', 1)),
        a.delete_(a.attribute(a.variable('a', 1), 'a', 1), 1)
    ]);
})


test('return', () => {
    let r = parseProgram('return 1 + 2;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.return_(a.binop('+', a.number('1', 1), a.number('2', 1), 1), 1)
    ]);
});

test('return needs space', () => {
    let r = parseProgram('return1 + 2;');
    expect(r.kind).toBe('error');
});

test('return null', () => {
    let r = parseProgram('return;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.return_(a.none(1), 1)
    ]);
});

test('return parenthese', () => {
    let r = parseProgram('return(1 + 2);');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.return_(a.binop('+', a.number('1', 1), a.number('2', 1), 1), 1)
    ]);
});

test('break', () => {
    let r = parseProgram(' break;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.break_(1)
    ]);
})

test('continue', () => {
    let r = parseProgram('continue ;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.continue_(1)
    ]);
})

test('static', () => {
    let r = parseProgram('1 + 2;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.static_(a.binop('+', a.number('1', 1), a.number('2', 1), 1))
    ]);
});

test('integer number', () => {
    let r = parseProgram('2395;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.static_(a.number('2395', 1))
    ]);
})

test('negative integer number', () => {
    let r = parseProgram('-2395;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.static_(a.number('-2395', 1))
    ]);
})

test('decimal number no decimal numbers', () => {
    let r = parseProgram('2395.;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.static_(a.number('2395.', 1))
    ]);
})

test('decimal number both sides', () => {
    let r = parseProgram('1.12;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.static_(a.number('1.12', 1))
    ]);
})

test('decimal number only deicmal numbers ', () => {
    let r = parseProgram('.12;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.static_(a.number('.12', 1))
    ]);
})

test('no decimal only', () => {
    let r = parseProgram('.;');
    expect(r.kind).toBe('error');
})

test('positive infinity', () => {
    let r = parseProgram('Infinity;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.static_(a.number('Infinity', 1))
    ]);
})

test('negative infinity', () => {
    let r = parseProgram('-Infinity;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.static_(a.number('-Infinity', 1))
    ]);
})

test('scientific number postive', () => {
    let r = parseProgram('1e21;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.static_(a.number('1e21', 1))
    ]);
})

test('scientific number negative', () => {
    let r = parseProgram('1e-7;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.static_(a.number('1e-7', 1))
    ]);
})

test('e needs a number', () => {
    let r = parseProgram('1.2141e;');
    expect(r.kind).toBe('error');
});

test('string single quotes', () => {
    let r = parseProgram(" a = 'string';");
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('a', 1)], a.string('string', 1))
    ]);
})

test('string double quotes', () => {
    let r = parseProgram(' a = "string1 () => 1; lkd//rd;dg;ad_0qlkfgfhjo";');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('a', 1)], a.string('string1 () => 1; lkd//rd;dg;ad_0qlkfgfhjo', 1))
    ]);
})


test('string space', () => {
    let r = parseProgram(" a = '  ';");
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('a', 1)], a.string('  ', 1))
    ]);
})

test('string newline', () => {
    let r = parseProgram(" a = '\n';");
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('a', 1)], a.string('\n', 1))
    ]);
})

test('boolean true', () => {
    let r = parseProgram(" a = true;");
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('a', 1)], a.bool(true, 1))
    ]);
})

test('boolean false', () => {
    let r = parseProgram(" a = false;");
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('a', 1)], a.bool(false, 1))
    ]);
})

test('none declaration', () => {
    let r = parseProgram(" a = none;");
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('a', 1)], a.none(1))
    ]);
})

test('arithmetic and bitwise precedence', () => {
    let r = parseProgram('x = 1 << 2 * 3 + 3 & 4 // 2 - 1 >> 3 | 3 % 2 ^ 4;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('^', a.binop('|', a.binop('&', a.binop('<<', a.number('1', 1), a.binop('+', a.binop('*', a.number('2', 1), a.number('3', 1), 1), a.number('3', 1), 1), 1)
        , a.binop('>>', a.binop('-', a.binop('//', a.number('4', 1), a.number('2', 1), 1), a.number('1', 1), 1), a.number('3', 1), 1), 1), a.binop('%', a.number('3', 1), a.number('2', 1), 1), 1), a.number('4', 1), 1))
    ]);
});

test('logical precedence', () => {
    let r = parseProgram('x = false || !false && true;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('||', a.bool(false, 1), a.binop('&&', a.unop('!', a.bool(false, 1), 1), a.bool(true, 1), 1), 1))
    ]);
});

test('comparison', () => {
    let r = parseProgram('x = 1 > 2;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('>', a.number('1', 1), a.number('2', 1), 1))
    ]);
});

test('comparison chain', () => {
    let r = parseProgram('x = 3 < 2 < 3 < 4;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('&&', a.binop('&&', a.binop('<', a.number('3', 1), a.number('2', 1), 1), 
            a.binop('<', a.number('2', 1), a.number('3', 1), 1), 1), a.binop('<', a.number('3', 1), a.number('4', 1), 1), 1))
    ]);
});

test('subtraction binding', () => {
    let r = parseProgram('x = 1 - 2 - 3;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('-', a.binop('-', a.number('1', 1), a.number('2', 1), 1), a.number('3', 1), 1))
    ]);
});

test('leading space in program', () => {
    let r = parseProgram('  x = 1;');
    expect(r.kind).toBe('ok');
});

test('semicolons and whitespace in program', () => {
    let r = parseProgram('   ;;;;;;;;;;;   ; ;   x      =     1;  ;;;;;;;;;;; ;;;;;;;;;; ');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.number('1', 1))
    ]);
});

test('leading white space in expression', () => {
    let r = parseProgram(' 1 + 2;');
    expect(r.kind).toBe('ok');
});


test('left associative call', () => {
    let r = parseProgram('foo = x => x; x = -foo(1);')
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('foo', 1)], a.closure(['x'], [a.return_(a.variable('x', 1), 1)], 1)),
        a.assignment([a.identifier('x', 1)], a.unop('-', a.call(a.variable('foo', 1), [a.number('1', 1)], 1), 1))
    ]);
});


test('left associative unary', () => {
    let r = parseProgram('x = 2 * ~2;')
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('*', a.number('2', 1), a.unop('~', a.number('2', 1), 1), 1))
    ]);
});

test('Left associative mul', () => {
    let r = parseProgram('x = 1 + 2 / 3;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('+', a.number('1', 1), a.binop('/', a.number('2', 1), a.number('3', 1), 1), 1))
    ]);
});

test('Left associative add', () => {
    let r = parseProgram('x = 1 << 2 - 3;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('<<', a.number('1', 1), a.binop('-', a.number('2', 1), a.number('3', 1), 1), 1))
    ]);
});

test('Left associative shift', () => {
    let r = parseProgram('x = 1 & 2 >> 1;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('&', a.number('1', 1), a.binop('>>', a.number('2', 1), a.number('1', 1), 1), 1))
    ]);
});

test('Left associative bitAnd', () => {
    let r = parseProgram('x = 1 | 2 & 3;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('|', a.number('1', 1), a.binop('&', a.number('2', 1), a.number('3', 1), 1), 1))
    ]);
});

test('Left associative bitOr', () => {
    let r = parseProgram('x = 1 ^ 2 | 3;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('^', a.number('1', 1), a.binop('|', a.number('2', 1), a.number('3', 1), 1), 1))
    ]);
});

test('Left associative bitXOr', () => {
    let r = parseProgram('x = 1 == 2 ^ 3;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('==', a.number('1', 1), a.binop('^', a.number('2', 1), a.number('3', 1), 1), 1))
    ]);
});

test('Left associative comparison', () => {
    let r = parseProgram('x = true && 1 < 3;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('&&', a.bool(true, 1), a.binop('<', a.number('1', 1), a.number('3', 1), 1), 1))
    ]);
});

test('Left associative and', () => {
    let r = parseProgram('x = false || true && false;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.binop('||', a.bool(false, 1), a.binop('&&', a.bool(true, 1), a.bool(false, 1), 1), 1))
    ]);
});


test('left associative or', () => {
    let r = parseProgram('x = true ? 1 : false || true;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.ternary(a.bool(true, 1), a.number('1', 1), a.binop('||', a.bool(false, 1), a.bool(true, 1), 1), 1))
    ])
});


test('ternary declaration', () => {
    let r = parseProgram('x = true ? 1 : 0;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.ternary(a.bool(true, 1), a.number('1', 1), a.number('0', 1), 1))
    ])
});


test('trivial ternary nested', () => {
    let r = parseProgram('x = true ? (false ? 1 : 0) : (true ? 1 : 0);');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.ternary(a.bool(true, 1), a.ternary(a.bool(false, 1), a.number('1', 1), a.number('0', 1), 1),
        a.ternary(a.bool(true, 1), a.number('1', 1), a.number('0', 1), 1), 1))
    ])
});

test('ternary precedence', () => {
    let r = parseProgram('x = true || false ? false || true : 0;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.ternary(a.binop('||', a.bool(true, 1), a.bool(false, 1), 1), a.binop('||', a.bool(false, 1), a.bool(true, 1), 1), a.number('0', 1), 1))
    ]);
});


test('nested ternary needs parentheses', () => {
    let r = parseProgram('x = 10; x = x ? x ? 1 : 0 : 0;');
    expect(r.kind).toBe('error');
});


test('Left associative complicated', () => {
    let r = parseProgram('foo = x => x; x = foo(2) == 3 || (2 - 1 * ~2 > 2);');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('foo', 1)], a.closure(['x'], [a.return_(a.variable('x', 1), 1)], 1))
        , a.assignment([a.identifier('x', 1)], a.binop('||', a.binop('==', a.call(a.variable('foo', 1), [a.number('2', 1)], 1)
        , a.number('3', 1), 1), a.binop('>', a.binop('-', a.number('2', 1), a.binop('*', a.number('1', 1), a.unop('~', a.number('2', 1), 1), 1), 1), a.number('2', 1), 1), 1))
    ]);
});


test('Closure definition with return line', () => {
    let r = parseProgram('foo = (a, b) => a + b;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('foo', 1)], a.closure(['a', 'b'], [a.return_(a.binop('+', a.variable('a', 1), a.variable('b', 1), 1), 1)], 1))
    ]);
});


test('Closure definition with block', () => {
    let r = parseProgram('foo = (a, b) => { return a + b; };');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('foo', 1)], a.closure(['a', 'b'], [a.return_(a.binop('+', a.variable('a', 1), a.variable('b', 1), 1), 1)], 1))
    ]);
});

test('Nested Closure definition', () => {
    let r = parseProgram('foo = (a, b) => { closure = () => a + b; return closure; };');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('foo', 1)], a.closure(['a', 'b']
        , [a.assignment([a.identifier('closure', 1)], a.closure([], [a.return_(a.binop('+', a.variable('a', 1), a.variable('b', 1), 1), 1)], 1)), a.return_(a.variable('closure', 1), 1)], 1))
    ]);
});

test('Closure in-line', () => {
    let r = parseProgram('foo = (a, b) => { return () => a + b; };');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('foo', 1)], a.closure(['a', 'b']
        , [a.return_(a.closure([], [a.return_(a.binop('+', a.variable('a', 1), a.variable('b', 1), 1), 1)], 1), 1)], 1))
    ]);
});


test('Function call', () => {
    let r = parseProgram('foo = (a, b) => a + b; foo(1, 2);');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('foo', 1)], a.closure(['a', 'b'], [a.return_(a.binop('+', a.variable('a', 1), a.variable('b', 1), 1), 1)], 1))
        , a.static_(a.call(a.variable('foo', 1), [a.number('1', 1), a.number('2', 1)], 1))
    ]);
});

test('Function call currying', () => {
    let r = parseProgram('foo = a => b => c => a * b * c; foo(2)(4)(6);');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('foo', 1)], a.closure(['a'], [a.return_(a.closure(['b'], [a.return_(a.closure(['c'], [a.return_(
            a.binop('*', a.binop('*', a.variable('a', 1), a.variable('b', 1), 1), a.variable('c', 1), 1), 1)], 1), 1)], 1), 1)], 1))
        , a.static_(a.call(a.call(a.call(a.variable('foo', 1), [a.number('2', 1)], 1), [a.number('4', 1)], 1), [a.number('6', 1)], 1))
    ]);
});

test('Function call recursive', () => {
    let r = parseProgram('foo = x => foo(x);');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('foo', 1)], a.closure(['x'], [a.return_(a.call(a.variable('foo', 1), [a.variable('x', 1)], 1), 1)], 1))
    ]);
});

test('Built in call', () => {
    let r = parseProgram('foo = abs(-1);')
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('foo', 1)], a.call(a.variable('abs', 1), [a.number('-1', 1)], 1))
    ])
})

test('Left associative function call', () => {
    let r = parseProgram('foo = x => x; x = 2 * -foo(3);');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('foo', 1)], a.closure(['x'], [a.return_(a.variable('x', 1), 1)], 1))
        , a.assignment([a.identifier('x', 1)], a.binop('*', a.number('2', 1), a.unop('-', a.call(a.variable('foo', 1), [a.number('3', 1)], 1), 1), 1))
    ]);
});

test('Function call in-place', () => {
    let r = parseProgram('x = ((a, b) => a + b)(1, 2);');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.call(a.closure(['a', 'b'], [a.return_(a.binop('+', a.variable('a', 1), a.variable('b', 1), 1), 1)], 1), [a.number('1', 1), a.number('2', 1)], 1))
    ]);
});

test('trivial ternary', () => {
    let r = parseProgram('x = 10; x = x ? 1 : 0;');
    expect(r.kind).toBe('ok');

});

test('trivial ternary nested', () => {
    let r = parseProgram('x = 10; x = x ? (x ? 1 : 0) : (x ? 1 : 0);');
    expect(r.kind).toBe('ok');
});

test('ternary precedence', () => {
    let r = parseProgram('x = 10; x = x || false ? false || true : 0;');
    expect(r.kind).toBe('ok');
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.number('10', 1))
        , a.assignment([a.identifier('x', 1)], a.ternary(a.binop('||', a.variable('x', 1), a.bool(false, 1), 1), a.binop('||', a.bool(false, 1), a.bool(true, 1), 1), a.number('0', 1), 1))
    ]);
});

test('nested ternary needs parentheses', () => {
    let r = parseProgram('x = 10; x = x ? x ? 1 : 0 : 0;');
    expect(r.kind).toBe('error');
});

test('trivial collection empty', () => {
    let r = parseProgram('x = {};');
    expect(r.kind).toBe('ok')
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.collection({}, 1))
    ])
});

test('trivial collection', () => {
    let r = parseProgram('x = { a: true, b: 23, c : {} };');
    expect(r.kind).toBe('ok')
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('x', 1)], a.collection({'a': a.bool(true, 1), 'b': a.number('23', 1), 'c': a.collection({ }, 1)}, 1))
    ])
});

test('attribute accessor trivial', () => {
    let r =  parseProgram('y = 1; y.x;')
    expect(r.kind).toBe('ok')
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('y', 1)], a.number('1', 1)),
        a.static_(a.attribute(a.variable('y', 1), 'x', 1))
    ])
});

test('collection subscriptor trivial', () => {
    let r =  parseProgram('y = 1; y[1];')
    expect(r.kind).toBe('ok')
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('y', 1)], a.number('1', 1)),
        a.static_(a.subscriptor(a.variable('y', 1), a.number('1', 1), 1))
    ])
});

test('attribute chain trivial', () => {
    let r = parseProgram('y = 1; y.x.z;')
    expect(r.kind).toBe('ok')
    expect(r.unsafeGet()).toEqual([
        a.assignment([a.identifier('y', 1)], a.number('1', 1)),
        a.static_(a.attribute(a.attribute(a.variable('y', 1), 'x', 1), 'z', 1))
    ])
});

test('collection in-place assignment', () => {
    let r = parseProgram('{x : 1}.x = 23;')
    expect(r.kind).toBe('ok')
    expect(r.unsafeGet()).toEqual([
      a.assignment([a.attribute(a.collection({ 'x': a.number('1', 1)}, 1), 'x', 1)], a.number('23', 1))  
    ])
});
