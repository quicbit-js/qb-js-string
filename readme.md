# qb-js-string

Simple and limited generation of javascript literals (arrays, objects, strings...).

qb-js-string was written for [test-kit](https://github.com/quicbit-js/test-kit) to 
generate expected output in nicely formatted data tables.  test-kit offers an test.only()
option for both tap and tape as well as table-driven testing.  A new test.print() option
is being added to allow quick switching between running tests and creating test
assertions.  See test-kit for details.


## install

npm install qb-js-string

## usage

    > var jstr = require('qb-js-string')
    > console.log(jstr.table([['a','b'], [1,['x', 4, {b:false}] ], [2,['y',5,{a:23, b:true}]]]))
    
    [ 'a', 'b'                            ],
    [ 1  , [ 'x', 4, { b: false } ]       ],
    [ 2  , [ 'y', 5, { a: 23, b: true } ] ],
    
... this is how test-kit generates nicely formated table rows from javascript test tables.