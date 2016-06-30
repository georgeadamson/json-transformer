'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_CONFIG = undefined;

var _jsonTransformerObjectutils = require('./json-transformer-objectutils.js');

var _jsonTransformerObjectutils2 = _interopRequireDefault(_jsonTransformerObjectutils);

var _jsonTransformerExpandexpr = require('./json-transformer-expandexpr.js');

var _jsonTransformerExpandexpr2 = _interopRequireDefault(_jsonTransformerExpandexpr);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Code inspired by and adapted from https://github.com/openwebos/foundation-frameworks

var DEFAULT_CONFIG = {
  ignoreFunctions: false,
  ignoreEmptyObjects: false,
  ignoreEmptyArrays: false,
  ignoreUnderscoreProperties: false,
  ignorePartialObjects: false // <-- Deprecate this?
};

/** Class for a JSONTransformer methods */
var JSONTransformer = {

  /**
  * Transform json to a new shape defined by a json "template".
  * @param {object|json-string} json     - Source data
  * @param {string}             template - Target json format
  * @param {string}             config   - Optionally override default config settings
  * @returns {object} Beautiful new JSON object
  */
  transform: function transform(json, template, config) {
    var _this = this;

    var _config = Object.assign({}, DEFAULT_CONFIG, config);
    this._transformCache = {};
    this._expandExpr = _jsonTransformerExpandexpr2.default;

    // Just in case json object was provided as a json string:
    if ({}.toString.call(json) === '[object String]' && (json.indexOf('{') === 0 || json.indexOf('[') === 0)) {
      json = JSON.parse(json); // eslint-disable-line no-param-reassign
    }

    return _jsonTransformerObjectutils2.default.clone(template, _config, function (node) {
      if (node) {
        if (typeof node === 'function') {
          return node(json);
        } else if ({}.toString.call(node) === '[object String]' && ~node.indexOf('${')) {
          return _this._expandExpr(json, node);
        }
      }
      return node;
    });
  }

};

exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
exports.default = JSONTransformer;