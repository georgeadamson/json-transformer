'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

// Code inspired by and adapted from https://github.com/openwebos/foundation-frameworks

// @@@LICENSE
//
//      Copyright (c) 2009-2012 Hewlett-Packard Development Company, L.P.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// LICENSE@@@

// TODO: Refactor all the old code that relied on these techniques:
/* eslint-disable no-shadow, no-param-reassign, no-nested-ternary, no-eval, prefer-rest-params */

function slice(obj, start, end, step) {
  // eslint-disable-line no-unused-vars
  // handles slice operations: [3:6:2]
  var len = obj.length;
  var results = [];
  end = end || len;
  start = start < 0 ? Math.max(0, start + len) : Math.min(len, start);
  end = end < 0 ? Math.max(0, end + len) : Math.min(len, end);
  for (var i = start; i < end; i += step) {
    results.push(obj[i]);
  }
  return results;
}

function expand(obj, name) {
  // eslint-disable-line no-unused-vars
  // handles ..name, .*, [*], [val1,val2], [val]
  // name can be a property to search for, undefined for full recursive, or an array for picking by index
  var results = [];
  function walk(obj) {
    if (name) {
      if (name === true && !(obj instanceof Array)) {
        // recursive object search
        results.push(obj);
      } else if (obj[name]) {
        // found the name, add to our results
        results.push(obj[name]);
      }
    }
    for (var i in obj) {
      // eslint-disable-line no-restricted-syntax, guard-for-in
      var val = obj[i];
      if (!name) {
        // if we don't have a name we are just getting all the properties values (.* or [*])
        results.push(val);
      } else if (val && (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') {
        walk(val);
      }
    }
  }
  if (name instanceof Array) {
    // this is called when multiple items are in the brackets: [3,4,5]
    if (name.length === 1) {
      // this can happen as a result of the parser becoming confused about commas
      // in the brackets like [@.func(4,2)]. Fixing the parser would require recursive
      // analsys, very expensive, but this fixes the problem nicely.
      return obj[name[0]];
    }
    for (var i = 0; i < name.length; i++) {
      results.push(obj[name[i]]);
    }
  } else {
    // otherwise we expanding
    walk(obj);
  }
  return results;
}

function distinctFilter(array, callback) {
  // eslint-disable-line no-unused-vars
  // does the filter with removal of duplicates in O(n)
  var outArr = [];
  var primitives = {};
  for (var i = 0, l = array.length; i < l; ++i) {
    var value = array[i];
    if (callback(value, i, array)) {
      if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value) {
        // with objects we prevent duplicates with a marker property
        if (!value.__included) {
          value.__included = true;
          outArr.push(value);
        }
      } else if (!primitives[value + (typeof value === 'undefined' ? 'undefined' : _typeof(value))]) {
        // with primitives we prevent duplicates by putting it in a map
        primitives[value + (typeof value === 'undefined' ? 'undefined' : _typeof(value))] = true;
        outArr.push(value);
      }
    }
  }
  for (var _i = 0, _l = outArr.length; _i < _l; ++_i) {
    // cleanup the marker properties
    if (outArr[_i]) {
      delete outArr[_i].__included;
    }
  }
  return outArr;
}

function mapFilter(array, callback) {
  // eslint-disable-line no-unused-vars
  return array.map(callback);
}

function filterFilter(array, callback) {
  // eslint-disable-line no-unused-vars
  return array.filter(callback);
}

var jsonQuery = function jsonQuery(query, obj) {
  // summary:
  //     Performs a JSONQuery on the provided object and returns the results.
  //     If no object is provided (just a query), it returns a "compiled" function that evaluates objects
  //     according to the provided query.
  // query:
  //     Query string
  //   obj:
  //     Target of the JSONQuery
  //
  //  description:
  //    JSONQuery provides a comprehensive set of data querying tools including filtering,
  //    recursive search, sorting, mapping, range selection, and powerful expressions with
  //    wildcard string comparisons and various operators. JSONQuery generally supersets
  //     JSONPath and provides syntax that matches and behaves like JavaScript where
  //     possible.
  //
  //    JSONQuery evaluations begin with the provided object, which can referenced with
  //     $. From
  //     the starting object, various operators can be successively applied, each operating
  //     on the result of the last operation.
  //
  //     Supported Operators:
  //     --------------------
  //    * .property - This will return the provided property of the object, behaving exactly
  //     like JavaScript.
  //     * [expression] - This returns the property name/index defined by the evaluation of
  //     the provided expression, behaving exactly like JavaScript.
  //    * [?expression] - This will perform a filter operation on an array, returning all the
  //     items in an array that match the provided expression. This operator does not
  //    need to be in brackets, you can simply use ?expression, but since it does not
  //    have any containment, no operators can be used afterwards when used
  //     without brackets.
  //    * [^?expression] - This will perform a distinct filter operation on an array. This behaves
  //    as [?expression] except that it will remove any duplicate values/objects from the
  //    result set.
  //     * [/expression], [\expression], [/expression, /expression] - This performs a sort
  //     operation on an array, with sort based on the provide expression. Multiple comma delimited sort
  //     expressions can be provided for multiple sort orders (first being highest priority). /
  //    indicates ascending order and \ indicates descending order
  //     * [=expression] - This performs a map operation on an array, creating a new array
  //    with each item being the evaluation of the expression for each item in the source array.
  //    * [start:end:step] - This performs an array slice/range operation, returning the elements
  //    from the optional start index to the optional end index, stepping by the optional step number.
  //     * [expr,expr] - This a union operator, returning an array of all the property/index values from
  //     the evaluation of the comma delimited expressions.
  //     * .* or [*] - This returns the values of all the properties of the current object.
  //     * $ - This is the root object, If a JSONQuery expression does not being with a $,
  //     it will be auto-inserted at the beginning.
  //     * @ - This is the current object in filter, sort, and map expressions. This is generally
  //     not necessary, names are auto-converted to property references of the current object
  //     in expressions.
  //     *  ..property - Performs a recursive search for the given property name, returning
  //     an array of all values with such a property name in the current object and any subobjects
  //     * expr = expr - Performs a comparison (like JS's ==). When comparing to
  //     a string, the comparison string may contain wildcards * (matches any number of
  //     characters) and ? (matches any single character).
  //     * expr ~ expr - Performs a string comparison with case insensitivity.
  //    * ..[?expression] - This will perform a deep search filter operation on all the objects and
  //     subobjects of the current data. Rather than only searching an array, this will search
  //     property values, arrays, and their children.
  //    * $1,$2,$3, etc. - These are references to extra parameters passed to the query
  //    function or the evaluator function.
  //    * +, -, /, *, &, |, %, (, ), <, >, <=, >=, != - These operators behave just as they do
  //     in JavaScript.
  //
  //
  //
  //   |  dojox.json.query(queryString,object)
  //     and
  //   |  dojox.json.query(queryString)(object)
  //     always return identical results. The first one immediately evaluates, the second one returns a
  //     function that then evaluates the object.
  //
  //   example:
  //   |  dojox.json.query("foo",{foo:"bar"})
  //     This will return "bar".
  //
  //  example:
  //  |  evaluator = dojox.json.query("?foo='bar'&rating>3");
  //    This creates a function that finds all the objects in an array with a property
  //    foo that is equals to "bar" and with a rating property with a value greater
  //    than 3.
  //  |  evaluator([{foo:"bar",rating:4},{foo:"baz",rating:2}])
  //     This returns:
  //   |  {foo:"bar",rating:4}
  //
  //  example:
  //   |  evaluator = dojox.json.query("$[?price<15.00][\rating][0:10]");
  //      This finds objects in array with a price less than 15.00 and sorts then
  //     by rating, highest rated first, and returns the first ten items in from this
  //     filtered and sorted list.
  var depth = 0;
  var str = [];
  query = query.replace(/"(\\.|[^"\\])*"|'(\\.|[^'\\])*'|[\[\]]/g, function (t) {
    depth += t === '[' ? 1 : t === ']' ? -1 : 0; // keep track of bracket depth
    return t === ']' && depth > 0 ? '`]' : // we mark all the inner brackets as skippable
    t.charAt(0) === '"' || t.charAt(0) === '\'' ? '`' + (str.push(t) - 1) : // and replace all the strings
    t;
  });
  var prefix = '';
  function call(name) {
    // creates a function call and puts the expression so far in a parameter for a call
    prefix = name + '(' + prefix;
  }
  function makeRegex(t, a, b, c, d, e, f, g) {
    // creates a regular expression matcher for when wildcards and ignore case is used
    return str[g].match(/[\*\?]/) || f === '~' ? '/^' + str[g].substring(1, str[g].length - 1).replace(/\\([btnfr\\"'])|([^\w\*\?])/g, '\\$1$2').replace(/([\*\?])/g, '[\\w\\W]$1') + (f === '~' ? '$/i' : '$/') + ('.test(' + a + ')') : // eslint-disable-line prefer-template
    t;
  }
  query.replace(/(\]|\)|push|pop|shift|splice|sort|reverse)\s*\(/, function () {
    throw new Error('Unsafe function call');
  });

  // change the equals to comparisons
  query = query.replace(/([^=]=)([^=])/g, '$1=$2').replace(/@|(\.\s*)?[a-zA-Z\$_]+(\s*:)?/g, function (t) {
    return t.charAt(0) === '.' ? t : // leave .prop alone
    t === '@' ? '$obj' : // the reference to the current object
    (t.match(/:|^(\$|Math|true|false|null)$/) ? '' : '$obj.') + t // plain names should be properties of root... unless they are a label in object initializer
    ;
  }).replace(/\.?\.?\[(`\]|[^\]])*\]|\?.*|\.\.([\w\$_]+)|\.\*/g, function (t, a, b) {
    var oper = t.match(/^\.?\.?(\[\s*\^?\?|\^?\?|\[\s*==)(.*?)\]?$/); // [?expr] and ?expr and [=expr and =expr
    if (oper) {
      var _prefix = ''; // eslint-disable-line no-shadow
      if (t.match(/^\./)) {
        // recursive object search
        call('expand');
        _prefix = ',true)';
      }
      call(oper[1].match(/=/) ? 'mapFilter' : oper[1].match(/\^/) ? 'distinctFilter' : 'filterFilter');
      return _prefix + ',function($obj){return ' + oper[2] + '})';
    }
    oper = t.match(/^\[\s*([\/\\].*)\]/); // [/sortexpr,\sortexpr]
    if (oper) {
      // make a copy of the array and then sort it using the sorting expression
      return '.concat().sort(function(a,b){' + oper[1].replace(/\s*,?\s*([\/\\])\s*([^,\\\/]+)/g, function (t, a, b) {
        // eslint-disable-line prefer-template
        ['var av=', b.replace(/\$obj/, 'a'), ',bv= ', b.replace(/\$obj/, 'b'), // FIXME: Should check to make sure the $obj token isn't followed by characters
        ';if(av>bv||bv==null){return ', a === '/' ? 1 : -1, '}\n' + 'if(bv>av||av==null){return ', a === '/' ? -1 : 1, '}\n'].join('');
      }) + 'return 0})';
    }
    oper = t.match(/^\[(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)\]/); // slice [0:3]
    if (oper) {
      call('slice');
      return ',' + (oper[1] || 0) + ',' + (oper[2] || 0) + ',' + (oper[3] || 1) + ')';
    }
    if (t.match(/^\.\.|\.\*|\[\s*\*\s*\]|,/)) {
      // ..prop and [*]
      call('expand');
      return (t.charAt(1) === '.' ? // eslint-disable-line prefer-template
      ',\'' + b + '\'' : // ..prop
      t.match(/,/) ? ',' + t : // [prop1,prop2]
      '') + ')'; // [*]
    }
    return t;
  }).replace(/(\$obj\s*((\.\s*[\w_$]+\s*)|(\[\s*`([0-9]+)\s*`\]))*)(==|~)\s*`([0-9]+)/g, makeRegex) // create regex matching
  .replace(/`([0-9]+)\s*(==|~)\s*(\$obj\s*((\.\s*[\w_$]+)|(\[\s*`([0-9]+)\s*`\]))*)/g, function (t, a, b, c, d, e, f, g) {
    return makeRegex(t, c, d, e, f, g, b, a);
  }); // and do it for reverse =

  query = prefix + (query.charAt(0) === '$' ? '' : '$') + query.replace(/`([0-9]+|\])/g, function (t, a) {
    return a === ']' ? ']' : str[a];
  }); // restore the strings

  // create a function within this scope (so it can use expand and slice)
  var executor = eval('1&&function($,$1,$2,$3,$4,$5,$6,$7,$8,$9){var $obj=$;return ' + query + '}');
  for (var i = 0; i < arguments.length - 1; i++) {
    arguments[i] = arguments[i + 1];
  }
  try {
    return obj ? executor.apply(this, arguments) : executor;
  } catch (e) {
    return undefined;
  }
};

exports.default = jsonQuery;