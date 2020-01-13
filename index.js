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

var assign = require('qb-assign')

var DEFAULT_GAPS = [
  // ogap (outter gap) (next to braces)           [<here>val1, val2<here>]
  // vgap (value gap) between values              [ val1,<here>val2 ]
  //      and between object key-value pairs      { key1: val1,<here>key2: val2 }
  // kgap (key gap) is the gap between key-value  { key1:<here>val1, key2:<here>val2 }
  {ogap: ' ', kgap: ' ', vgap: ' '},    // depth  0
  {ogap: '',  kgap: ' ', vgap: ' '},    // depth  1
  {ogap: '',  kgap: '', vgap: ''},      // depth >1
]

// these options create strings for java test tables using
// test-kit's array 'a(...)' and object 'o(...)' functions.

var DEFAULT_OPTS = {
  js: {
    lang: 'js',
    undefined_string: 'undefined',
    arr_beg: '[',
    arr_end: ']',
    obj_beg: '{',
    obj_end: '}',
    keyval_sep: ':',
    val_sep: ',',
    row_beg: '[ ',
    row_end: ' ]',
    row_sep: ',\n',
    cell_sep: ',',
    tbl_beg: '[\n',
    tbl_end: ',\n]',
    indent: '  ',
    quotes: ["'", '"'],  // if a string contains quotes, the quote needing least escapes is chosen
    // gap settings by depth. deeply nested values are more squeezed together
    gaps: DEFAULT_GAPS,
  }
}

DEFAULT_OPTS.java = assign({}, DEFAULT_OPTS.js, {
  lang: 'java',
  undefined_string: 'null',
  arr_beg: 'a(',
  arr_end: ')',
  obj_beg: 'o(',
  obj_end: ')',
  keyval_sep: ',',
  row_beg: 'a( ',
  row_end: ' )',
  tbl_beg: 'a(\n',
  tbl_end: '\n);',
  indent: '    ',
  quotes: ['"'],
})

function init_opt (opt) {
  var ret
  if (opt) {
    var dopt = DEFAULT_OPTS[opt.lang] || DEFAULT_OPTS.js
    ret = assign({}, dopt, opt)
    // use defaults to fill missing options at every depth.
    ret.gaps = Array.isArray(ret.gaps) ? ret.gaps : [ret.gaps]
    var dgaps = dopt.gaps
    ret.gaps = map(ret.gaps, function (o, i) {
      return assign({}, dgaps[i] || dgaps[dgaps.length-1], o)
    })
  } else {
    ret = DEFAULT_OPTS.js
  }
  if (!ret.quotes.obj) {
    // convert to object with quote keys (fast lookup)
    ret.quotes.obj = ret.quotes.reduce(function(m, v) { m[v] = 1; return m}, {})
  }
  return ret
}

function jstr (v, opt) {
  return _jstr(v, init_opt(opt), 0)
}

function _jstr (v, opt, depth) {
  if (v === null) {
    return 'null'
  } else if (v === undefined) {
    return opt.undefined_string
  } else {
    switch (typeof v) {
      case 'object':
        return Array.isArray(v) ? arr2str(v, opt, depth) : obj2str(v, opt, depth)
      case 'string':
        return str2str(v, opt)
      case 'number' :
      case 'boolean':
        return String(v)
      default:
        err('type "' + (typeof v) + '" not implemented')
    }
  }
}

function arr2str (a, opt, depth) {
  if (a.length === 0) { return opt.arr_beg + opt.arr_end }
  var gap = opt.gaps[depth] || opt.gaps[opt.gaps.length-1]
  var last = a.length - 1
  var ret = map(a, function (v, i) { return _jstr(v, opt, depth + 1) + (i < last ? opt.val_sep : '') })
  return opt.arr_beg + gap.ogap + ret.join(gap.vgap) + gap.ogap + opt.arr_end
}

function obj2str (o, opt, depth) {
  var keys = Object.keys(o)
  if (keys.length === 0) { return opt.obj_beg + opt.obj_end }
  var gap = opt.gaps[depth] || opt.gaps[opt.gaps.length-1]
  var pairs = map(keys, function (k) { return key2str(k, opt) + opt.keyval_sep + gap.kgap + _jstr(o[k], opt, depth + 1) })
  return opt.obj_beg + gap.ogap + pairs.join(opt.val_sep + gap.vgap) + gap.ogap + opt.obj_end
}

function is_table (a) {
  if (a.length < 2) { return false }
  var len = a[0].length
  return !a.find(function (v) {
    if (is_comment(v)) {
      return false
    }
    return !v || (v.length && v.length !== len) || !Array.isArray(v)
  })
}

function padr (s, l) { while (s.length < l) s += ' '; return s }

function is_comment (s) {
  return typeof s === 'string' && s[0] === '#'
}

// array.map() will skip undefined values such as [,3] - only iterating on the defined.  This
// map() function iterates all values from zero to a.length().
function map (a, fn) {
  var len = a.length;
  var ret = []
  for (var i=0; i<len; i++) {
    ret[i] = fn(a[i], i)
  }
  return ret;
}

function table_rows (a, opt) {
  opt = init_opt(opt)
  var numcols = a.find(function (row) { return !is_comment(row) }).length
  var cell_strings = map(a, function (row) {
    if (is_comment(row)) {
      return row
    }
    return map(row, function (v, ci) {
      return _jstr(v, opt, 0) + (ci < numcols - 1 ? opt.cell_sep : '')
    })
  })
  var widths = []; for (var i = 0; i < numcols; i++) { widths[i] = 0 }

  cell_strings.forEach(function (row) {
    if (is_comment(row)) {
      return
    }
    row.forEach(function (s, ci) {
      var slen = s.length
      if (slen > widths[ci]) { widths[ci] = slen }
    })
  })

  return map(cell_strings, function (row) {
    if (is_comment(row)) {
      return _jstr(row, opt)
    }
    var last = row.length - 1
    var padded = map(row, function (s, ci) {
      return ci === last ? s : padr(s, widths[ci])  // don't pad last column
    })
    return opt.row_beg + padded.join(' ') + opt.row_end
  })
}

function table (a, opt) {
  is_table(a) || err('data is not a table (array of 2 or more same-length arrays)')
  opt = init_opt(opt)
  var indented_rows = opt.indent + table_rows(a, opt).join(opt.row_sep + opt.indent)
  return opt.tbl_beg + indented_rows + opt.tbl_end
}

// escape logic is based on logic in http://github.com/douglascrockford/JSON-js,
// with additional characters from ECMA-262:
// line terminators: \u000A <LF> \u000D <CR> \u2028 <LS> \u2029 <PS>
// other mentions (not listed in slash_esc)
//    \u00A0   no-break space
//    \uFEFF   byte order mark
//    \u0020   space (not escaped)
//    PLUS - any unicode whitespace
var slash_esc = {
  '\b': '\\b',      //  \u0008   <BS> backspace
  '\t': '\\t',      //  \u0009   <HT> horizontal tab
  '\n': '\\n',      //  \u000A   <LF> new line (line feed)
  '\v': '\\v',      //  \u000B   <VT> vertical tab
  '\f': '\\f',      //  \u000C   <FF> form feed
  '\r': '\\r',      //  \u000D   <CR> carriage return
  '\\': '\\\\'     //  \u005C   backslash
}

var esc_re = /[\\\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g

function str2str (s, opt) {
  esc_re.lastIndex = 0
  if (esc_re.test(s)) {
    s = s.replace(esc_re, function (c) {
      return slash_esc[c] || '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)
    })
  }
  return quote(s, opt);
}

function quote (s, opt) {
  var q = opt.quotes[0] // default quote
  var q_counts = {}
  for (var i=0; i<s.length; i++) {
    var c = s[i]
    if (opt.quotes.obj[c]) {
      q_counts[c] = (q_counts[c] || 0) + 1
    }
  }
  var quotes_found = Object.keys(q_counts)
  if (quotes_found.length) {
    if (opt.quotes.length > 1) {
      // set q to first unused quote
      q = opt.quotes.find(function (q) {return q_counts[q] == null})
      if (q == null) {
        // all quotes used, set q to least-used
        q = opt.quotes.reduce(function (c, q) {
          return q_counts[q] < q_counts[c] ? q : c
        }, opt.quotes[0])
      }
    }
    var quote_exp = new RegExp( q, 'g')
    s = s.replace(quote_exp, '\\' + q)
  }
  return q + s + q
}

function key2str (k, opt) {
  return (k.match(/^[_$a-zA-Z][_$a-zA-Z0-9]*$/)) ? k : str2str(k, opt)
}

function err (msg) { throw Error(msg) }

jstr.table_rows = table_rows
jstr.table = table
jstr.quote = function (s, opt) { return quote(s, init_opt(opt)) }

module.exports = jstr
