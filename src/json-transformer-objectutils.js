
// Code inspired by and adapted from https://github.com/openwebos/foundation-frameworks

// @@@LICENSE
//
//      Copyright (c) 2009-2012 Hewlett-Packard Development Company, L.P.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// LICENSE@@@

const ObjectUtils = {
  type : (model) => {
    if (model === null) {
      return 'null';
    } else if (model === undefined) {
      return 'undefined';
    } else if (typeof model === 'number') {
      return 'number';
    } else if (typeof model === 'string') {
      return 'string';
    } else if (model === true || model === false) {
      return 'boolean';
    } else if (Object.prototype.toString.call(model) === '[object Array]') {
      return 'array';
    } else if (typeof model === 'function') {
      return 'function';
    }
    return 'object';
  },

  clone : function clone (model, options, onnode) {
    return this._clone(model, options || {}, '$', onnode || (v => v));
  },

  _clone : function _clone (model, options, path, onnode) {
    switch (this.type(model)) {
      case 'null':
        return onnode(null, path);
      case 'undefined':
        return onnode(undefined, path);
      case 'number':
      case 'boolean':
      case 'string':
        return onnode(model, path);
      case 'array':
        return onnode(this._cloneArray(model, options, path, onnode), path);
      case 'function':
        return onnode(options.ignoreFunctions ? undefined : model, path);
      case 'object':
      default:
        return onnode(this._cloneObject(model, options, path, onnode), path);
    }
  },

  _cloneObject : function _cloneObject (model, options, path, onnode) {
    const nmodel = {};
    let count = 0;
    let total = 0;
    const keys = Object.keys(model);
    const length = keys.length;
    // for (const key in model) {
    for (let i = 0; i < length; i++) {
      const key = keys[i];
      if (!options.ignoreUnderscoreProperties || key.indexOf('_') !== 0) {
        const val = this._clone(model[key], options, `${path}.${key}`, onnode);
        if (val !== undefined) {
          nmodel[key] = val;
          count++;
        }
        total++;
      }
    }
    // If total property count in the new object isnt the same as the old, then we
    // have a partial object.  If we're ignoring them (and this one isnt explicity marked true) we
    // dont include it.
    if ('__partial' in model) {
      count++;
    }
    if (total !== count && options.ignorePartialObjects && model.__partial !== true) {
      count = 0;
    }
    return !options.ignoreEmptyObjects || count > 0 ? nmodel : undefined;
  },

  _cloneArray : function _cloneArray (array, options, path, onnode) {
    const narray = [];
    const len = array.length;
    for (let i = 0; i < len; i++) {
      const val = this._clone(array[i], options, `${path}[${i}]`, onnode);
      if (val !== undefined || !options.ignoreEmptyArrays) {
        narray.push(val);
      }
    }
    return narray.length > 0 || !options.ignoreEmptyArrays ? narray : undefined;
  },


};

export default ObjectUtils;
