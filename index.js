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

var DEFAULT_OPT = {
  // lang: 'js', for javascript strings, 'java' for java-compatible
  // lang: java, for java-compatible strings
  arr_beg: '[',
  arr_end: ']',
  obj_beg: '{',
  obj_end: '}',
  keyval_sep: ':',
  val_sep: ',',
  row_sep: ',',
  cell_sep: ',',
  quote: ["'", '"'],  // if more than one, the best is chosen.
  // gap settings by depth. deeply nested values are more squeezed together
  gaps: [
    // ogap (outter gap) (next to braces)           [<here>val1, val2<here>]
    // vgap (value gap) between values              [ val1,<here>val2 ]
    //      and between object key-value pairs      { key1: val1,<here>key2: val2 }
    // kgap (key gap) is the gap between key-value  { key1:<here>val1, key2:<here>val2 }
    {ogap: ' ', kgap: ' ', vgap: ' '},    // depth  0
    {ogap: '',  kgap: ' ', vgap: ' '},    // depth  1
    {ogap: '',  kgap: '', vgap: ''},      // depth >1
  ]
}

function init_opt (opt) {
  var ret
  if (opt) {
    ret = assign({}, DEFAULT_OPT, opt)
    // use defaults to fill missing options at every depth.
    ret.lang = ret.lang || 'js'
    if (ret.gaps) {
      ret.gaps = Array.isArray(ret.gaps) ? ret.gaps : [ret.gaps]
      var dgaps = DEFAULT_OPT.gaps
      ret.gaps = ret.gaps.map(function (o, i) {
        return assign({}, dgaps[i] || dgaps[dgaps.length-1], o)
      })
    }
  } else {
    ret = DEFAULT_OPT
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
    return 'undefined'
  } else {
    switch (typeof v) {
      case 'object':
        return Array.isArray(v) ? arr2str(v, opt, depth) : obj2str(v, opt, depth)
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

function arr2str (a, opt, depth) {
  if (a.length === 0) { return opt.arr_beg + opt.arr_end }
  var gap = opt.gaps[depth] || opt.gaps[opt.gaps.length-1]
  var last = a.length - 1
  var ret = a.map(function (v, i) { return _jstr(v, opt, depth + 1) + (i < last ? opt.val_sep : '') })
  return opt.arr_beg + gap.ogap + ret.join(gap.vgap) + gap.ogap + opt.arr_end
}

function obj2str (o, opt, depth) {
  var keys = Object.keys(o)
  if (keys.length === 0) { return opt.obj_beg + opt.obj_end }
  var gap = opt.gaps[depth] || opt.gaps[opt.gaps.length-1]
  var pairs = keys.map(function (k) { return key2str(k) + opt.keyval_sep + gap.kgap + _jstr(o[k], opt, depth + 1) })
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
function table_rows (a, opt) {
  var numcols = a.find(function (row) { return !is_comment(row) }).length
  var cell_strings = a.map(function (row) {
    if (is_comment(row)) {
      return row
    }
    return row.map(function (v, ci) {
      return _jstr(v, init_opt(opt), 0) + (ci < numcols - 1 ? opt.row_sep : '')     // put comma next to data (less cluttered)
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

  return cell_strings.map(function (row) {
    if (is_comment(row)) {
      return _jstr(row) + opt.cell_sep
    }
    var last = row.length - 1
    var padded = row.map(function (s, ci) {
      return ci === last ? s : padr(s, widths[ci])  // don't pad last column
    })
    return '[ ' + padded.join(' ') + ' ],'
  })
}

function table (a, opt) {
  is_table(a) || err('data is not a table (array of 2 or more same-length arrays)')
  return table_rows(a, opt).join('\n')
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
