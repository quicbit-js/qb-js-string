# qb-js-string


[![npm][npm-image]][npm-url]
[![downloads][downloads-image]][npm-url]

[npm-image]:       https://img.shields.io/npm/v/qb-js-string.svg
[downloads-image]: https://img.shields.io/npm/dm/qb-js-string.svg
[npm-url]:         https://npmjs.org/package/qb-js-string

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
    
    [ 'a', 'b' ],
    [ 1  , [ 'x', 4, { b: false } ] ],
    [ 2  , [ 'y', 5, { a: 23, b: true } ] ],
    
... this is how test-kit generates nicely formated table rows from javascript test tables.

## java string support

Release 1.2.0 introduces java string support and new options for printing.  This allows 
simple output of data tables in java that can be used for data-driven testing:

    > console.log(jstr.table([['a','b'], [1,['x', 4, {b:false}] ], [2,['y',5,{a:23, b:true}]]], {lang:'java'}))
    a(
        a( "a", "b" ),
        a( 1,   a( "x", 4, o(b, false) ) ),
        a( 2,   a( "y", 5, o(a, 23, b, true) ) )
    );

Using the quicbit java testkit with JUnit, this text is valid java with the exact same input and expected output
checks:

    import org.junit.Test;
    
    import static com.quicbit.TestKit.*;
    
    public class SelectTest {
        @Test
        public void testRegex() {
    
            table(
                a( "a", "b" ),
                a( 1,   a( "x", 4, o(b, false) ) ),
                a( 2,   a( "y", 5, o(a, 23, b, true) ) )
            ).test("regex",
                (r) -> my_tests(r.intval("a"))
            );
        }
    }

    


## Dev Notes

It would be nice to extend the formatting to do this:

// simple flex-spacing algorithm prioritizes left-most column alignment and when
// exceeded, attempts to recover alignment on subsequent columns.  So when arranging
// test data, placing smaller columns to the left to creates better fit.
// So the position of col2 and col3 below represent the max point that accomodated all
// qualifying data.  Rows labled '1&2' fit col1 and col2 and exceeded (40) at
// col3.  Rows '1&3' failed to fit col2, but fit again at col3 and were used to
// align that column.
// (max_col: 20)
//
//        0                   20                  40                  60
//        |                   |                   |                   |
//      [ 'col1',       'col2',                'col3' ],
// 123  [ 'short',      'medium_len',          'long long long long long' ],
// 123  [ 'short',      'medium_len',          'long long long long long' ],
// 1&2  [ 'medium_len', 'long long long long long long', 'short' ],
// 1&2  [ 'medium_len', 'long long long long long long', 'short' ],
// 123  [ 'short',      'short',               'long long long long long' ],
// 123  [ 'short',      'medium_len',          'long long long long long' ],
// 1&3  [ 'long long long long long', 'short', 'long long long long long' ],
// 1&3  [ 'long long long long long', 'short', 'medium len' ],
//


... that would create nice layouts.  In fact, the design of a table sizing tool for tree-structures is quite 
interesting.  The approach that comes to mind is a tree of nodes that could answer the question - what is your
min size, and what is your preferred size, and perhaps what are the sizes in-between that you like and 
even - how much do you prefer those sizes.  Parents would then find nice column layout by asking children - that
ask their children.  Children could also report sizes in two dimensions - row and column - and the text table could
allow cells to be vertical when horizontal was too long.  In doing the layout there would be 3 stages:

* create tree
* measure
* generate

Creating the tree is the creation of nodes mentioned above, basically mapping a plain object tree to a node tree.
Measuring is asking children their preference and answering parent those same questions.  A parent node attempts to
fit its children into a specified layout.  The table does this by comparing answers from it's children's children
to fit into columns.  Generating is the parent telling the nodes to go ahead and make themselves (return text) 
within a given constraint that they promised they would/could generate, and padding/aligning this output.

The same algorithm might be able to create a number of formats by simply defining new leaf nodes and reusing the
array/object algos with different settings/delimiters.