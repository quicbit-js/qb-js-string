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

test('jstr() literals', function (t) {
    t.table_assert([
        [   's',              'exp' ],
        [    '',               "''" ],
        [ 'abc',            "'abc'" ],
        [ "Bill's",         "\"Bill's\"" ],
        [ 'a\n',            "'a\\n'" ],
        [ 'a\\b',            "'a\\\\b'" ],
        [ 'x\u2028y\u2029\u2030', "'x\\u2028y\\u2029‰'" ],
        [     9,                "9" ],
        [ 3.245,            "3.245" ],
        [ true,             "true"  ],
        [ false,           "false"  ],
        [  null,             "null" ],
    ], jstr )
})

test('jstr() array - single', function (t) {
    t.table_assert([
        [ 'a',                      'exp' ],
        [ [],                       "[]" ],
        [ [1],                      "[ 1 ]" ],
        [ ['a'],                    "[ 'a' ]" ],
        [ [9],                      "[ 9 ]" ],
        [ [1,2,null,"",'x'],        "[ 1, 2, null, '', 'x' ]"],
    ], jstr)
})

test('jstr() object', function (t) {
    t.table_assert([
        [ 'a',                              'exp' ],
        [ {},                               "{}" ],
        [ {'a':2},                          "{ a: 2 }" ],
        [ {'a':{'b':7}},                    "{ a: { b: 7 } }" ],
        [ {'a':null, 'b': undefined },      "{ a: null, b: undefined }" ],
    ], jstr)
})

test('jstr.table_rows()', function (t) {
    t.table_assert([
        [ 'tbl',                                    'exp' ],
        [ [['a'], [1], [2]],                        [ "[ 'a' ],", "[ 1   ],", "[ 2   ]," ] ],
        [ [['a','b'], [1,'x'], [2,'y']],            [ "[ 'a', 'b' ],", "[ 1  , 'x' ],", "[ 2  , 'y' ]," ] ],
        [ [['a','b'], [1,['x', 4]], [2,['y',5]]],   [ "[ 'a', 'b'        ],", "[ 1  , [ 'x', 4 ] ],", "[ 2  , [ 'y', 5 ] ]," ] ],
    ], jstr.table_rows)
})

test('jstr.table()', function (t) {
    t.table_assert([
        [ 'tbl',                                    'exp' ],
        [ [['a'], [1], [2]],                        "[ 'a' ],\n[ 1   ],\n[ 2   ]," ],
        [ [['a','b'], [1,'x'], [2,'y']],            "[ 'a', 'b' ],\n[ 1  , 'x' ],\n[ 2  , 'y' ]," ],
        [ [['a','b'], [1,['x', 4]], [2,['y',5]]],   "[ 'a', 'b'        ],\n[ 1  , [ 'x', 4 ] ],\n[ 2  , [ 'y', 5 ] ]," ],
    ], jstr.table)
})