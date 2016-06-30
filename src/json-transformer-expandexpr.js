
// Code inspired by and adapted from https://github.com/openwebos/foundation-frameworks

import jsonQuery from './json-transformer-query.js';

const rPlaceholder = /\$\{([^{]*)\}/g;

export default function expandExpr (data, expr) {
  // function transform (regexp, q, val) {
  //   var matches = regexp.exec(q(val));
  //   return matches ? matches[1] || matches[0] : "";
  // }

  const self = this;
  const ret = expr.replace(rPlaceholder, ($0, $1) => {
    let q = self._transformCache[$1];
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
      q = jsonQuery($1);
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
