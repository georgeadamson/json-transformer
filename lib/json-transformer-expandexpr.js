'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = expandExpr;

var _jsonTransformerQuery = require('./json-transformer-query.js');

var _jsonTransformerQuery2 = _interopRequireDefault(_jsonTransformerQuery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var rPlaceholder = /\$\{([^{]*)\}/g;
// Code inspired by and adapted from https://github.com/openwebos/foundation-frameworks

function expandExpr(data, expr) {
  // function transform (regexp, q, val) {
  //   var matches = regexp.exec(q(val));
  //   return matches ? matches[1] || matches[0] : "";
  // }

  var self = this;
  var ret = expr.replace(rPlaceholder, function ($0, $1) {
    var q = self._transformCache[$1];
    if (!q) {
      // Looks like the original code attempted to handle a placeholder containing a regex:
      // But what is the .curry method it's calling?!
      // if ($1.slice(-1) === '/') {
      //   var cmds = $1.split('/');
      //   cmds.pop();
      //   var regexp = cmds.pop();
      //   q = transform.curry(new RegExp(regexp), jsonQuery(cmds.join('/')));
      // }
      // else {
      q = (0, _jsonTransformerQuery2.default)($1);
      // }
      self._transformCache[$1] = q;
    }
    try {
      return q(data) || '';
    } catch (e) {
      return '';
    }
  });

  return ret.search(/\S/) !== -1 ? ret : undefined;
}