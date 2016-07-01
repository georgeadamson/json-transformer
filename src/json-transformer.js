
// Code inspired by and adapted from https://github.com/openwebos/foundation-frameworks

import ObjectUtils from './json-transformer-objectutils.js';
import expandExpr from './json-transformer-expandexpr.js';
import Handlebars from 'handlebars';

const DEFAULT_CONFIG = {
  ignoreFunctions            : false,
  ignoreEmptyObjects         : false,
  ignoreEmptyArrays          : false,
  ignoreUnderscoreProperties : false,
  ignorePartialObjects       : false  // <-- Deprecate this?
};



/** Class for a JSONTransformer methods */
const JSONTransformer = {

  /**
  * Transform json to a new shape defined by a json "template".
  * @param {object|json-string} json     - Source data
  * @param {string}             template - Target json format
  * @param {string}             config   - Optionally override default config settings
  * @returns {object} Beautiful new JSON object
  */
  transform : function transform (json, template = json, config = null, context = this) {
    const _config = Object.assign({}, DEFAULT_CONFIG, config);
    this._transformCache = {};
    this._expandExpr = expandExpr;

    // Just in case json object was provided as a json string:
    if (Object.prototype.toString.call(json) === '[object String]' && (json.indexOf('{') === 0 || json.indexOf('[') === 0)) {
      json = JSON.parse(json);  // eslint-disable-line no-param-reassign
    }

    return ObjectUtils.clone(template, _config, node => {
      if (node) {
        if (Object.prototype.toString.call(node) === '[object String]' && ~node.indexOf('${')) {
          return this._expandExpr(json, node);
        } else if (Object.prototype.toString.call(node) === '[object Function]') {
          return node.call(context, json);
        }
      }
      return node;
    });
  },

  tx : function tx (json, template) {

    if( Object.prototype.toString.call(json) !== '[object String]' ) {
      template = JSON.stringify(template);
    }

    var match;
    var re = new RegExp('\\${' + '([\\s\\S]+?)' + '}', 'g');
    while (match = re.exec(template)) {
      template = template.replace(re, '{{' + match[1] + '}}');
    }

    var transform = Handlebars.compile( JSON.stringify(template) );
    var resultString = transform(json);
    var result = JSON.parse(resultString);

    return result

  }

};


export { DEFAULT_CONFIG };
export default JSONTransformer;
