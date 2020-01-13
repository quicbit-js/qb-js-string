// Software License Agreement (ISC License)
//
// Copyright (c) 2017, Matthew Voss
//
// Permission to use, copy, modify, and/or distribute this software for
// any purpose with or without fee is hereby granted, provided that the
// above copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

var test = require('test-kit').tape()
var jstr = require('.')

test('esc_quotes', function (t) {
  t.table_assert([
    [ 's',   'opt',    'exp' ],
    [ '',     null,     "''"   ],
    [ '',     {lang:'java'},     '""'   ],
    [ '1hi1',   {quotes:['1','2','3']},     '21hi12'   ],
    [ '"It\'s quoted"' ,     {lang:'java'},     '"\\"It\'s quoted\\""'   ],

  ], jstr.quote)

})

test('literals', function (t) {
  t.table_assert([
    [  'v',                   'opt',               'exp' ],
    [ "\"Bill's\"",           {lang: 'java'},       "\"\\\"Bill's\\\"\"" ],
    [  '',                    null,                 "''" ],
    [ 'abc',                  null,                 "'abc'" ],
    [ "Bill's",               null,                 "\"Bill's\"" ],
    [ "\"Bill's\"",           null,                 "'\"Bill\\'s\"'" ],
    [ "\"It's Bill's '\"",   null,                 '"\\"It\'s Bill\'s \'\\""'  ],
    [ 'a\n',                  null,                 "'a\\n'" ],
    [ 'a\\b',                 null,                 "'a\\\\b'" ],
    [ 'x\u2028y\u2029\u2030', null,                 "'x\\u2028y\\u2029‰'" ],
    [ 9,                      null,                 "9" ],
    [ 3.245,                  null,                 "3.245" ],
    [ true,                   null,                 "true"  ],
    [ false,                  null,                 "false"  ],
    [  null,                  null,                 "null" ],
  ], jstr )
})

test('errors',          function (t) {
  t.table_assert([
    [ 'v',                      'exp' ],
    [ function () {},           /type "function" not implemented/ ],
  ], jstr, {assert: 'throws'} )
})

test('array', function (t) {
  t.table_assert([
    [ 'a',                'opt',                   'exp' ],
    [ [],                 null,                    "[]" ],
    [ [1],                null,                    "[ 1 ]" ],
    [ [1],                {gaps: {ogap: ''}},              "[1]" ],
    [ ['a'],              null,                    "[ 'a' ]" ],
    [ [9],                null,                    "[ 9 ]" ],
    [ [1,2,null,"",'x'],  {gaps: {ogap: '', vgap: ''}},    "[1,2,null,'','x']"],
    [ [1,2,null,"",'x'],  {gaps: {ogap: ' ', vgap: ''}},   "[ 1,2,null,'','x' ]"],
    [ [1,2,null,"",'x'],  {gaps: {ogap: ' ', vgap: ' '}},  "[ 1, 2, null, '', 'x' ]"],
    [ [1,2,null,"",'x'],  null,                    "[ 1, 2, null, '', 'x' ]"],
    [ [1,[2,3],[4,5,6]],  null,                    '[ 1, [2, 3], [4, 5, 6] ]' ],
    [ [1,[2,[3,4,5,6]]],  null,                    '[ 1, [2, [3,4,5,6]] ]' ],
  ], jstr)
})

test('object', function (t) {
  t.table_assert([
    [ 'a',                              'exp' ],
    [ {},                               "{}" ],
    [ {'a':2},                          "{ a: 2 }" ],
    [ {'a':{'b':7}},                    "{ a: {b: 7} }" ],
    [ {'a':null, 'b': undefined },      "{ a: null, b: undefined }" ],
    [ { '&q': true },                   "{ '&q': true }" ],
  ], jstr)
})

test('arr/obj combo', function (t) {
  t.table_assert([
    [ 'a',                                 'opt',                             'exp'                                 ],
    [ [ { a: 1 }, [1, [2,3,{ '4': 5 }]] ], { gaps: { ogap: '', kgap: '', vgap: '' } },  "[{a:1},[1,[2,3,{'4':5}]]]"           ],
    [ [ { a: 1 }, [1, [2,3,{ '4': 5 }]] ], { gaps: { ogap: ' ', kgap: '', vgap: '' } }, "[ { a:1 },[ 1,[ 2,3,{ '4':5 } ] ] ]" ],
    [ [ { a: 1 }, [1, [2,3,{ '4': 5 }]] ], { gaps: { ogap: '', kgap: ' ', vgap: '' } }, "[{a: 1},[1,[2,3,{'4': 5}]]]"         ],
    [ [ { a: 1 }, [1, [2,3,{ '4': 5 }]] ], { gaps: { ogap: '', kgap: '', vgap: ' ' } }, "[{a:1}, [1, [2, 3, {'4':5}]]]"       ],
    [
      [ { a: 1 }, [1, [2,3,{ '4': 5 }]] ],
      { gaps: [ { vgap: '__v__' }, { vgap: '_v_' }, { vgap: 'v' }, {vgap: '' } ] },
      "[ {a: 1},__v__[1,_v_[2,v3,v{'4':5}]] ]"
    ],
    [
      [ { a: 1 }, [1, [2,3,{ '4': 5 }]] ],
      { gaps: [ { ogap: '_O_', kgap: '_K_', vgap: '_V_' }, { ogap: '~O~', kgap: '~K~', vgap: '~V~' } ] },
      "[_O_{~O~a:~K~1~O~},_V_[~O~1,~V~[~O~2,~V~3,~V~{~O~'4':~K~5~O~}~O~]~O~]_O_]"
    ],
  ], jstr)
})

test('table_rows', function (t) {
  t.table_assert([
    [ 'tbl',                                    'exp' ],
    [
      [['a'], [1], [2]],
      [
        "[ 'a' ]",
        "[ 1 ]",
        "[ 2 ]"
      ]
    ],
    [
      [
        ['a','b'], [1,'x'], [2,'y']], [
        "[ 'a', 'b' ]",
        "[ 1,   'x' ]",
        "[ 2,   'y' ]"
      ]
    ],
    [
      [
        ['a','b'], [,'x'], [2,'y']], [
      "[ 'a',       'b' ]",
      "[ undefined, 'x' ]",
      "[ 2,         'y' ]"
    ]
    ],
    [
      [['a','b'], [1,['x', 4]], [2,['y',5]]],   [
      "[ 'a', 'b' ]",
      "[ 1,   [ 'x', 4 ] ]",
      "[ 2,   [ 'y', 5 ] ]"
    ] ],
  ], jstr.table_rows)
})

test('table_rows comments', function (t) {
  t.table_assert([
    [ 'tbl',                                    'exp' ],
    [ ['#head', ['a'], [1], '#r2', [2], '#tail'], [
      "'#head'",
      "[ 'a' ]",
      "[ 1 ]",
      "'#r2'",
      "[ 2 ]",
      "'#tail'"
    ]],
  ], jstr.table_rows)
})

test('table', function (t) {
  t.table_assert([
    [ 'tbl',                                    'exp' ],
    [
      [['a'], [1], [2]],
      t.lines(`
        [
          [ 'a' ],
          [ 1 ],
          [ 2 ],
        ]
      `
      ).join('\n')
    ],
    [ [['a','b'], [1,'x'], [2,'y']],
      t.lines(`
        [
          [ 'a', 'b' ],
          [ 1,   'x' ],
          [ 2,   'y' ],
        ]
      `).join('\n')
    ],
    [ [['a','b'], '#r1', [1,['x', 4]], [2,['y',5]]],
      t.lines(`
        [
          [ 'a', 'b' ],
          '#r1',
          [ 1,   [ 'x', 4 ] ],
          [ 2,   [ 'y', 5 ] ],
        ]
      `).join('\n')
    ],
  ], jstr.table)
})

test('table() errors', function (t) {
  t.table_assert([
    [ 'tbl',                                    'exp' ],
    [ [['a'], [1, 2]],                          /data is not a table/ ],
    [ [['a', 'b', 'c']],                        /data is not a table/ ],
  ], jstr.table, {assert: 'throws'})
})

test('table_rows JAVA', function (t) {
  t.table_assert([
    [ 'tbl',        'opt',                            'exp' ],
    [ [['a'], [1], [2]], {lang: 'java'}, [
      'a( "a" )',
      'a( 1 )',
      'a( 2 )'
    ]],
    [ [['a','b'], [1,'x'], [2,'y']], {lang: 'java'}, [
      'a( "a", "b" )',
      'a( 1,   "x" )',
      'a( 2,   "y" )'
    ]],
    [ [['a','b'], [,'x'], [2,'y']], {lang: 'java'}, [  // undefined values
      'a( "a",  "b" )',
      'a( null, "x" )',
      'a( 2,    "y" )'
    ]],
    [ [['a','b'], [1,['x', 4]], [2,['y',5]]],   {lang: 'java'}, [
      'a( "a", "b" )',
      'a( 1,   a( "x", 4 ) )',
      'a( 2,   a( "y", 5 ) )'
    ]],
  ], jstr.table_rows)
})

test('table JAVA', function (t) {
  t.table_assert([
    [ 'tbl',         'opt',                           'exp' ],
    [
      [['a'], [1], [2]],
      {lang: 'java'},
      t.lines(`
          a(
              a( "a" ),
              a( 1 ),
              a( 2 )
          );
      `).join('\n')
    ],
    [
      [['a','b'], [1,'x'], [2,'y'] ],
      {lang: 'java'},
      t.lines(`
        a(
            a( "a", "b" ),
            a( 1,   "x" ),
            a( 2,   "y" )
        );
      `).join('\n')
    ],
    [
      [ ['a','b'], '#r1', [1,['x', 4]], [2,['y',5]] ],
      {lang: 'java'},
      t.lines(`
        a(
            a( "a", "b" ),
            "#r1",
            a( 1,   a( "x", 4 ) ),
            a( 2,   a( "y", 5 ) )
        );
      `).join('\n')
    ],
  ], jstr.table)
})