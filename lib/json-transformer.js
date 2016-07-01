'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_CONFIG = undefined;

var _jsonTransformerObjectutils = require('./json-transformer-objectutils.js');

var _jsonTransformerObjectutils2 = _interopRequireDefault(_jsonTransformerObjectutils);

var _jsonTransformerExpandexpr = require('./json-transformer-expandexpr.js');

var _jsonTransformerExpandexpr2 = _interopRequireDefault(_jsonTransformerExpandexpr);

var _handlebars = require('handlebars');

var _handlebars2 = _interopRequireDefault(_handlebars);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_CONFIG = {
  ignoreFunctions: false,
  ignoreEmptyObjects: false,
  ignoreEmptyArrays: false,
  ignoreUnderscoreProperties: false,
  ignorePartialObjects: false // <-- Deprecate this?
};

/** Class for a JSONTransformer methods */

// Code inspired by and adapted from https://github.com/openwebos/foundation-frameworks

var JSONTransformer = {

  /**
  * Transform json to a new shape defined by a json "template".
  * @param {object|json-string} json     - Source data
  * @param {string}             template - Target json format
  * @param {string}             config   - Optionally override default config settings
  * @returns {object} Beautiful new JSON object
  */
  transform: function transform(json) {
    var template = arguments.length <= 1 || arguments[1] === undefined ? json : arguments[1];

    var _this = this;

    var config = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
    var context = arguments.length <= 3 || arguments[3] === undefined ? this : arguments[3];

    var _config = Object.assign({}, DEFAULT_CONFIG, config);
    this._transformCache = {};
    this._expandExpr = _jsonTransformerExpandexpr2.default;

    // Just in case json object was provided as a json string:
    if (Object.prototype.toString.call(json) === '[object String]' && (json.indexOf('{') === 0 || json.indexOf('[') === 0)) {
      json = JSON.parse(json); // eslint-disable-line no-param-reassign
    }

    return _jsonTransformerObjectutils2.default.clone(template, _config, function (node) {
      if (node) {
        if (Object.prototype.toString.call(node) === '[object String]' && ~node.indexOf('${')) {
          return _this._expandExpr(json, node);
        } else if (Object.prototype.toString.call(node) === '[object Function]') {
          return node.call(context, json);
        }
      }
      return node;
    });
  },

  tx: function tx(json, template) {

    var match;
    var re = new RegExp('\\${' + '([\\s\\S]+?)' + '}', 'g');
    template = JSON.stringify(template);
    while (match = re.exec(template)) {
      template = template.replace(re, '{{' + match[1] + '}}');
    }

    var transform = _handlebars2.default.compile(JSON.stringify(template));
    var resultString = transform(json);
    var result = JSON.parse(resultString);

    return result;
  }

};

exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
exports.default = JSONTransformer;