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

// options-by-depth.
var DEFAULT_OPT = [
  // igap is initial gap (next to brace) [ <here> val1, val2 <here> ]
  // gap is gap between values [ val1,<here>val2 ] - gets smaller at greater depths
  {igap: ' ', gap: ' '},  // depth  0
  {igap: '',  gap: ' '},   // depth  1
  {igap: '',  gap: ''},    // depth >1
]

function init_opt (opt) {
  var ret
  if (opt) {
    // use defaults to fill missing options at every depth.
    ret = Array.isArray(opt) ? opt : [opt]
    ret = ret.map(function (o, i) {
      return assign({}, DEFAULT_OPT[i] || DEFAULT_OPT[DEFAULT_OPT.length-1], o)
    })
  } else {
    ret = DEFAULT_OPT
  }
  return ret
}

function jstr (v, opt) {
  return _jstr(v, init_opt(opt), 0)
}

function _jstr (v, optarr, depth) {
  if (v === null) {
    return 'null'
  } else if (v === undefined) {
    return 'undefined'
  } else {
    switch (typeof v) {
      case 'object':
        return Array.isArray(v) ? arr2str(v, optarr, depth) : obj2str(v, optarr, depth)
      case 'string':
        return str2str(v)
      case 'number' :
      case 'boolean':
        return String(v)
      default:
        err('type "' + (typeof v) + '" not implemented')
    }
  }
}

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
function arr2str (a, optarr, depth) {
  if (a.length === 0) { return '[]' }
  var opt = optarr[depth] || optarr[optarr.length-1]
  var last = a.length - 1
  var ret = a.map(function (v, i) { return _jstr(v, optarr, depth + 1) + (i < last ? ',' : '') })
  return '[' + opt.igap + ret.join(opt.gap) + opt.igap + ']'
}

function obj2str (o, optarr, depth) {
  var keys = Object.keys(o)
  if (keys.length === 0) { return '{}' }
  var pairs = keys.map(function (k) { return key2str(k) + ': ' + _jstr(o[k], optarr, depth + 1) })
  return '{ ' + pairs.join(', ') + ' }'
}

function is_table (a) {
  if (a.length < 2) { return false }
  var len = a[0].length
  return !a.find(function (v) {
    return !v || (v.length && v.length !== len) || !Array.isArray(v)
  })
}

function padr (s, l, c) { while (s.length < l) s = s + c; return s }

function table_rows (a, opt) {
  var cell_strings = a.map(function (row) { return row.map(function (v) { return _jstr(v, init_opt(opt), 0) }) })
  var numcols = cell_strings[0].length
  var widths = []; for (var i = 0; i < numcols; i++) { widths[i] = 0 }

  cell_strings.forEach(function (row) {
    row.forEach(function (s, i) {
      var slen = s.length + (i < numcols.length - 1 ? 1 : 0)    // + 1 for comma
      if (slen > widths[i]) { widths[i] = slen }
    })
  })

  return cell_strings.map(function (row) {
    var padded = row.map(function (s, i) {
      // add commas next to data (less cluttered and easier to manage by hand later)
      if (i < row.length - 1) { s += ',' }
      return padr(s, widths[i], ' ')
    })
    return '[ ' + padded.join(' ') + ' ],'
  })
}

function table (a, opt) {
  is_table(a) || err('data is not a table (array of 2 or more same-length arrays)')
  return table_rows(a, opt).join('\n')
}

// escape logic, especially the regex, is based on logic in http://github.com/douglascrockford/JSON-js,
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
var qt_esc = {
  '"': '\\"',
  "'": "\\'"
}
var quote_re = {
  '"': /"/g,
  "'": /'/g
}
var esc_re = /['\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g

function str2str (s) {
  esc_re.lastIndex = 0
  var q = "'"
  if (esc_re.test(s)) {
    var s_qt = 0    // number single-quotes
    var d_qt = 0    // number double-quotes
    s = s.replace(esc_re, function (c) {
      var ret = slash_esc[c]
      if (ret) {
      } else if (c === '"') {
        d_qt++; ret = c             // just count
      } else if (c === "'") {
        s_qt++; ret = c             // just count
      } else {
        ret = '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)
      }
      return ret
    })
    if (s_qt) {
      if (d_qt < s_qt) {
        q = '"'
      }
      if (d_qt) {
        // string has single and double quotes - escape the chosen quote (least-bad)
        s = s.replace(quote_re[q], qt_esc[q])
      }
    }
  }
  return q + s + q
}

function key2str (k) {
  return (k.match(/^[_$a-zA-Z][_$a-zA-Z0-9]*$/)) ? k : str2str(k)
}

function err (msg) { throw Error(msg) }

jstr.table_rows = table_rows
jstr.table = table

module.exports = jstr
