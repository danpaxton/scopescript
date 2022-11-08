# ScopeScript
View language IDE: https://github.com/danpaxton/scopescript-ide<br>

## Parser
Given code as raw text, the parser converts it into a syntax tree defined by an operator precedence and a set of grammar rules. Text is parsed left to right in top down manner. The parser is built from larger parse functions built out of smaller parse functions. Specifically, the parser starts by parsing text using simple regular expression parsers. Then, parses expressions using these regex parsers. Then, parses statements using expression parsers. Lastly, parses programs using statement parsers. Operator precedence is handled by building lower precedence operator parsers that use the next highest precedence operator parser as their main parse function. This allows the parser to bind to higher precedence operators before lower precedence operators. The variable checker traverses the syntax tree and maintains a set of bound variables at each level of the program. The variable checker is used to find cases of undeclared variables, duplicate parameters, valid statment use and invalid built-in function use. The parser is built using the [Parsimmon library](https://www.npmjs.com/package/parsimmon).

## Interpreter
The interpreter is built using a network of JavaScript objects that maps a 'kind' to a function. The main two objects that drive decision making are the statements and expressions objects. The statements object returns a specific function given a statement kind, and the expressions dictionary returns a specific function given an expression kind. Certain statement functions use the statements object again (self-referencing) or the expressions object. Once the program is operating using the expressions object the only way to use to the statements object again would be through a function call, otherwise there is only access to the expressions object until the next statement in the program is executed. There also exists helper dictionaries for operator (binary or unary) and built-in function use, both are used by the expressions object. Programs and function blocks are both represented as a list of statements that the interpreter sequentially evaluates.

## Scope
Program scope is represented as a linked list of states. Each state is represented as an object python with value, parent, and out attributes. The 'value' attribute points to an object containing the state's local variables and their values. The 'parent' attribute points to the outer-state relative to itself. Lastly, the 'out' attribute points to the program output list. Variable look up starts in the current state and follows parents pointers to find variables that are global to the current state.

## Closures
Closures are represented as an object with params, body, parent and env attributes. The params attribute stores a list of strings that represent each parameter. The body attribute stores a block of code to be executed on call. The parent attribute maintains a link to it's creating state at closure creation time. Lastly, the env attribute is a stack that tracks the most recently made call environment. Variable look up during a function call follows the closure's lexical environment, not the current program scope.
<br> 
**At any point in the program, the only variables that can be referenced must be on the path from the current state to the outermost state. (i.e variables must be in scope)**

## Installation
Clone repository,
```console
$ git clone https://github.com/danpaxton/scopescript-parser.git`
$ cd scopescript
```
Install and run tests,
```console
$ npm install
$ npm run test
```

Or install package,
```console
$ npm i scopescript
```

## Operator Precedence
The table below summarizes operator precedence from highest precedence to lowest precedence. Operators in the same box have the same precedence. Operators without syntax are binary. All operators group left to right.
Operator| Description
---:| ---
`(expression),`<br>`{key: value...}` | Binding or parenthesized expression,<br> collection display
 `x(...), x.attribute, x[...]` | call, reference, subscriptor
 `!x, ~x, ++x, --x, +x, -x`| logical not, bitwise not, pre-increment, pre-decrement, unary plus, unary negative
`*, /, //, %` | multiplication, division, floor division, remainder
`+, -`| addition, subtraction
`<<, >>`| shifts
`&` | bit and
<code>&#124;</code> | bit or
`^` | bit xor
`<, >, <=, >=, !=, ==` | comparisons
`&&` | logical and
<code>&#124;&#124;</code> | logical or
`... ? ... : ...` | ternary 


## Grammar
Below is a set of instructions that define valid statements and expressions for the scope script programming language. Scope script is an imperative, dynamically-typed language. Each program consists of a series of statements that change the state of the program.

### Lexical
`type boolean ::= true | false`<br>

`type number ::= [+-]?([0-9]+\.?[0-9]*|\.[0-9]+)([eE][+-]?[0-9]+)? | Infinity | -Infinity `<br>

`type string ::= (['"])([^'"]*)\1`<br>

`type name ::= [a-zA-Z_$][a-zA-Z_$0-9]*`<br>

`type none ::= none`<br>

### Operators
`type unop ::= !, ~, ++, --, +, -`<br>

`type binop ::= *, /, //, %, +, -, <<, >>, |, &, |, ^, >=, <=, ==, !=, >, <, &&, ||`<br>

### Atoms
`type atom ::= { kind: 'none' }`<br>
`| { kind: 'boolean', value: boolean }`<br>
`| { kind: 'number', value: number }`<br>
`| { kind: 'string', value: string }`<br>
`| { kind: 'collection', value: { [ key: string ]: [ value: expression ] } }`<br>
`| { kind: 'variable', name: name }`<br>
`| { kind: 'closure', params: name[], body: statement[] }`<br>

### Expressions
`type expression ::= atom`<br>
`| { kind: 'unop', op: unop, expr: expression }`<br>
`| { kind: 'binop', op: binop, e1: expression, e2: expression }`<br>
`| { kind: 'call', fun: expression, args: expression[] }`<br>
`| { kind: 'subscriptor', dict: expression, expression: expression }`<br>
`| { kind: 'attribute', dict: expression, attribute: name }`<br>
`| { kind: 'ternary', test: expression, trueExpr: expression, falseExpr: expression }`<br>

### Statements
`type statement ::= { kind: 'static', expr: expression }`<br>
`| { kind: 'assignment', assignArr: expression[], expr: expression }`<br>
`| { kind: 'if', truePartArr : { test: expression, part: statement[] }[], falsePart: statement[] }`<br>
`| { kind: 'for', inits: statement[], test: expression, updates: statement[], body: statement[] }`<br>
`| { kind: 'while', test: expression, body: statement[]] }`<br>
`| { kind: 'delete', expr: expression }`<br>
`| { kind: 'return', expr: expression }`<br>
`| { kind: 'break' }`<br>
`| { kind: 'continue' }`<br>

### Program
`type program ::= { kind: 'ok', value: statement[] } | { kind: 'error', message: string }`

## Comments
Comments are specified using the `#` character.<br>

Example,<br>
`# integer value.`<br>
`x = 10;`


## None type
The absence of a value is specified using the `none` keyword.<br>

Example,<br>
`a = none;`

Uknown attribute reference returns none.<br>
Given `a = {}`, <br>
`a[1] == none` is equivalent to `True`.<br>


## Boolean
Boolean values are represented using `true` or `false`.<br>

Example,<br>
`a = true`, true assignment.<br>
`if (false) { ... }`, conditional test.

boolean values are a subset of number values.<br>
`0 + true` is equivalent to `1`.
`0 + false` is equivalent to `0`.


## Numbers
Numbers are represented as integers, or floats.<br>

Examples,<br>
`1`, integer number.<br>

`-3.66`, float number.<br>

`2.67e-100`, scientific notation.<br>

`Infinity`, infinity.<br>


## Strings
Strings are represented as a sequence of ascii characters between a matching pair of single or double quotes.<br>

Example,<br>
`''`, empty string.<br>

`' str1 '`, single quotes.<br>

`" str2 "`, double quotes.<br>

Strings can be subscripted at character positions.<br>
`'abc'[1]` is equivalent to `'b'`.


## Operators
Define an expression using a binary or unary operator.<br>

### Unary Operators
Syntax,<br>
`unop expression`<br>

Example,<br>
`!x`, `++x`<br>

### Binary Operators
Syntax,<br>
`expression binop expression`<br>

Example,<br>
`2 * 8`, `true && false`, `a == b`<br>

### Bitwise Operators
Bitwise Operators only operate on integers.<br>

Example,<br>
`~5`, `1 >> 2`<br>

Error,<br>
`1.5 >> 2.5`<br>

### Comparison chaining
Chaining comparsions will test each comparsion seperated by a logical AND (&&).<br>

Example,<br>
`1 < 2 < 3`, is equivalent to `1 < 2 && 2 < 3`.<br>

`1 == 2 < 3 != 4`, is equivalent to `1 == 2 && 2 < 3 && 3 != 4`.<br>


## Built-in functions
Built in functions with default return values unless overwritten.<br>

`type(..)`, returns the argument type.<br>

`ord(..)`, returns the ASCII value of the character argument.<br>

`abs(..)`, returns the absolute value of the number argument.<br>

`pow(..)`, returns the first argument to the power of the second argument.<br>

`len(..)`, returns the length of the collection or string argument.<br>

`bool(..)`, returns the boolean representation of the argument.<br>

`num(..)`, returns the number representation of the argument.<br>

`str(..)`, returns the string represenation of the argument.<br>

`keys(..)`, returns a zero-based indexed collection of the argument collection's keys.<br>

`print(.. , ...)`, displays arguments seperated by a space, and then a newline to output.<br>

## Assignment statement
Assign a variable, or a collection attribute to an expression.<br>

Syntax,<br>
`x = expression;`<br>
`x.attribute = expression;`<br>
`x[...] = expression;`

### Basic assignment
Example,<br>
`a = 1;`<br>

Assign multiple variables, or attributes the same value using an assignment chain.<br>
`a = b['key'] = c.val = 1;`<br>

### Compound assignment
`'+=' | '-=' | '*=' | '/=' | '%=' | '<<=' | '>>=' | '&=' | '^=' | '|='`<br>

A variable must be defined before compound assignment.<br>

Example,
`a = 1; a += 1;`<br>

A compound assigment and the equivalent simple assignment will be parsed into the same result.<br>
`a += 1;` is the same as `a = a + 1;`<br>

Assignment types cannot be mixed.<br>
`a = b += 1;` will result in a parse error.


## Closures
Store parameters, function code, and a link to lexical environment.<br>

No parameters,<br>
`foo = () => { message = 'Hello'; return message; }; foo();`

Single parameter,<br>
`foo = p => { return p + 1; }; foo(10);`

Multiple parameter,<br>
`foo = (a, b, c) => { return a + b + c; }; foo(1, 2, 3);`

Return line,<br>
`foo = (a, b) => { return a + b; };`, using return line `foo = (a, b) => a + b;`<br>

Both methods above will be parsed into the same result. Using no brackets allows only the one return statement.

Currying,<br>
`foo = a => b => c => a + b + c; foo(1)(2)(3);`


## Collections
Store a collection of attributes mapped to a value.<br>

Empty,<br>
`data = {};`<br>

New attributes,<br>
`data = {}; data['key'] = 1; data.number = 10;`<br>

`data` is now equivalent to `{ 'key': 1, 'number': 10 }`.<br>

Names,<br>
`data = { a: 1, 2: true };`, is the same as `data = { 'a': 1, '2': true };`.<br>

Numbers,<br>
`data = { 1: 1, 2: true };`<br> 

Strings,<br>
`data = { ' ': 1, 'key': true };`

Only named attributes can be accesed using the reference ( `x.attribute` ) operator. Any attribute can be accesed using the subscriptor ( `x[...]` ) operator. All attributes are stored as strings, `x[1]` is the same as `x['1']`.<br>

Example,<br>
`data = { 1: 1, key: true, ' ': false };`, access attribute `1` using `data[1]`, attribute `' '`
using `data[' ']` and attribute `key` using `data.key` or `data['key']`.<br>


## Ternary
Conditionally make decisions on the expression level. Defined by a test with a true expression and a false expression.<br>

Syntax,<br>
`a = test ? true expression : false expression;`

Ternary expressions can only contain expressions, use if statements for statement level conditionals.<br>

Nested ternary must be within parentheses.<br>

Example,<br>
`a = test1 ? ( test2 ? 1 : 3 ) : 2;`<br>

Parse error,<br>
`a = test1 ? test2 ? 1 : 3 : 2;`


## `if` statement
Conditionally make decisions on the statement level. Defined by a series of tests with associated parts, and finally a false part.<br>

Syntax,<br>
`if( test ) { part } else if ( test ) { part } ... else { false part }`<br>

`if` statements require brackets for more than one statement.<br>

if only,<br>
`if(true) 1 + 2;`<br>

if else,<br>
`if(true) { 1 + 2; } else { 1 + 2; }`<br>

if else-if,<br>
`if(true) { 1 + 2; } else if(true) { 1 + 2; }`<br>

if else-if else,<br>
`if(true) { 1 + 2; } else if (true) { 1 + 2; } else { 1 + 2; }`<br>


## `while` statement
Loop until termination defined by a test expression. <br>

Syntax, <br>
`while( test ) { body }`<br>

`while` loops require brackets for more than one statement.<br>

Example,<br>
`while(a < 10) ++a;`


## `for` statement
Loop with initializers. Performs updates at each iteration until termination defined by a test expression.<br>

Syntax, <br>
`for( inits , test , updates ) { body }`<br>

`for` statements require all parts. Require brackets for more than one statement.<br>

Initializers must be assignments and update variables must be defined.<br>

Example,<br>
`for(i = 0; i < 10; ++i) 2 + i;`<br>

`for(i = 0, j = z = 1; i < 10; ++i, ++z, --j) { z += j; j += i}`<br>

Errors,<br>

Need all parts, <br>
`for(i = 0; true; ) { 2 + i; }`<br>

`for(; true; ++i) { 2 + i; }`<br>

`z` not defined, <br>
`for(i = 0; i < 10; z = 0) i;`<br>

`true` not an assignment statement, <br>
`for(i = 0, true; i < 10; ++i) i;`<br>


## `return` statement
Returns an expression from a function call.<br>

Syntax, <br>
`return expression;`<br>

Example,<br>
`return 1 + 2;`<br>

No `return` statement or `return;`, are both equivalent to `return none;`.<br>

## `delete` statement
Removes an attribute from a collection.<br>

Syntax,<br>
`delete expression;`<br>

Example,<br>
`a = { 1 : true, a : true };`<br>
`delete a[1];`<br>
`delete a.a;`<br>
`a` is now equivalent to `{}`.

## `continue` statement
Explicitly jump to next loop iteration.<br>

Syntax,<br>
`continue;`

Example,<br>
`for(a = 0; a < 10; ++a) { continue; --a; }`<br>
The loop will run ten times because `a` is never decremented.

## `break` statement
Explicitly step out of loop iteration.<br>

Syntax,<br>
`break;`

Example,<br>
`while(true) { break; print(1);}`<br>
The loop will only run once and nothing will be printed because it breaks immediately.
