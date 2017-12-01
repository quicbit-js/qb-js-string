# qb-js-string


[![npm][npm-image]][npm-url]
[![downloads][downloads-image]][npm-url]
[![bitHound Dependencies][proddep-image]][proddep-link]
[![dev dependencies][devdep-image]][devdep-link]
[![code analysis][code-image]][code-link]

[npm-image]:       https://img.shields.io/npm/v/qb-js-string.svg
[downloads-image]: https://img.shields.io/npm/dm/qb-js-string.svg
[npm-url]:         https://npmjs.org/package/qb-js-string
[proddep-image]:   https://www.bithound.io/github/quicbit-js/qb-js-string/badges/dependencies.svg
[proddep-link]:    https://www.bithound.io/github/quicbit-js/qb-js-string/master/dependencies/npm
[devdep-image]:    https://www.bithound.io/github/quicbit-js/qb-js-string/badges/devDependencies.svg
[devdep-link]:     https://www.bithound.io/github/quicbit-js/qb-js-string/master/dependencies/npm
[code-image]:      https://www.bithound.io/github/quicbit-js/qb-js-string/badges/code.svg
[code-link]:       https://www.bithound.io/github/quicbit-js/qb-js-string

Simple and limited generation of javascript literals (arrays, objects, strings...).

qb-js-string was written for [test-kit](https://github.com/quicbit-js/test-kit) to 
generate expected output in nicely formatted data tables.  test-kit offers an test.only()
option for both tap and tape as well as table-driven testing.  A new test.print() option
is being added to allow quick switching between running tests and creating test
assertions.  See test-kit for details.

**Complies with the 100% test coverage and minimum dependency requirements** of 
[qb-standard](http://github.com/quicbit-js/qb-standard) . 


## install

npm install qb-js-string

## usage

    > var jstr = require('qb-js-string')
    > console.log(jstr.table([['a','b'], [1,['x', 4, {b:false}] ], [2,['y',5,{a:23, b:true}]]]))
    
    [ 'a', 'b'                            ],
    [ 1  , [ 'x', 4, { b: false } ]       ],
    [ 2  , [ 'y', 5, { a: 23, b: true } ] ],
    
... this is how test-kit generates nicely formated table rows from javascript test tables.