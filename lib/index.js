'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _pixelmatch = require('pixelmatch');

var _pixelmatch2 = _interopRequireDefault(_pixelmatch);

var _pngjs = require('pngjs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/** Class for a VizPure comparison object */

var VizPure = function () {
	/**
  * Create an instance of VizPure
  * @param {object} storage - A VizPure compatible Storage object
  * @returns {VizPure} A VizPure object.
  */

	function VizPure() {
		var storage = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

		_classCallCheck(this, VizPure);

		if (!storage.hasOwnProperty('isVizjsStorageObject')) {
			throw TypeError('Expected VizPure constructor to be called with a storage\n\t\t\t\tobject, got ' + storage + ' instead.');
		} else {
			this.storage = storage;
		}

		return this;
	}

	/**
 * Compare an image against existing reference data (if available)
 * @param {string} imageData - Base64 encoded PNG
 * @param {string} imageTag - A string uniquely identifying the screenshot to be compared
 * @returns {boolean} A boolean representing a match or no-match result from the image comparison
 */


	_createClass(VizPure, [{
		key: 'compare',
		value: function compare(imageData, imageTag) {
			var imageBuffer = this._base64Decode(imageData);

			if (!this.storage.exists(imageTag, this.storage.LABELS.REF)) {
				storage.write(imageBuffer, imageTag, this.storage.LABELS.NEW);
				return false;
			} else {
				var refImg = _pngjs.PNG.sync.read(this.storage.read(imageTag, this.storage.LABELS.REF));
				var testImg = _pngjs.PNG.sync.read(this._base64Decode(imageData));
				var imgWidth = Math.min(refImg.width, testImg.width);
				var imgHeight = Math.min(refImg.height, testImg.height);
				var diffImg = new _pngjs.PNG({
					width: imgWidth,
					height: imgHeight
				});

				var diffPixels = (0, _pixelmatch2.default)(refImg.data, testImg.data, diffImg.data, imgWidth, imgHeight, { threshold: 0.1 });

				this.storage.write(_pngjs.PNG.sync.write(diffImg), imageTag, this.storage.LABELS.DIF);

				console.log(diffPixels);
				// let diffImage = new PNG({width: refImage.width})
				//
				// let diff = pixelmatch(img1, img2, )
			}
		}

		/**
  * Crop an image to the specified dimensions
  * @param {Buffer} imageBuffer - Buffer containing PNG image data
  * @param {Object} dimensions - The Dimensions to crop the image to
  * @param {number} dimensions.x - The x-coordinate to start cropping from
  * @param {number} dimensions.y - The y-coordinate to start cropping from
  * @param {number} dimensions.width - The number of pixels on the x axis to crop
  * @param {number} dimensions.height - The number of pixels on the y axis to crop
  * @returns {Buffer} A Buffer containing the cropped image data
  */

	}, {
		key: 'crop',
		value: function crop() {
			var imageBuffer = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
			var dimensions = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

			if (!Buffer.isBuffer(imageBuffer)) {
				throw TypeError('Expected imageBuffer to be of type <Buffer>, got ' + imageBuffer);
			}
			if (!this._validateDimensions(dimensions)) {
				throw TypeError('Expected dimensions to be <Object> with properties \'x\', \'y\', \'width\' and \'height\'\n\t\t\t\t\tgot ' + dimensions);
			}

			var sourcePNG = _pngjs.PNG.sync.read(imageBuffer);
			var targetPNG = new _pngjs.PNG({ width: dimensions.width, height: dimensions.height });

			_pngjs.PNG.bitblt(sourcePNG, targetPNG, dimensions.x, dimensions.y, dimensions.width, dimensions.height, 0, 0);

			return _pngjs.PNG.sync.write(targetPNG);
		}

		/**
  * Takes raw image data and returns a base64 encoded string
  * @param {Buffer} imageBuffer - A Buffer of raw png image data
  * @return {string} Base64 encoded PNG data
  */

	}, {
		key: '_base64Encode',
		value: function _base64Encode(imageBuffer) {
			if (!Buffer.isBuffer(imageBuffer)) {
				throw TypeError('Expected imageBuffer to be of type <Buffer>, got ' + imageBuffer);
			}
			return imageBuffer.toString('base64');
		}

		/**
  * Takes base64 encoded PNG data and returns a raw image buffer
  * @param {string} imageData - A string of base64 encoded PNG image data
  * @return {Buffer} A buffer of raw PNG image data
  */

	}, {
		key: '_base64Decode',
		value: function _base64Decode(imageData) {
			if (typeof imageData !== 'string') {
				throw TypeError('Expected imageData to be of type <String>, got ' + (typeof imageData === 'undefined' ? 'undefined' : _typeof(imageData)));
			}
			return new Buffer(imageData, 'base64');
		}

		/**
  * Check if the passed dimensions object is valid
  * @param {Object} dimensions - A Dimensions object
  * @param {number} dimensions.x - X-coordinate
  * @param {number} dimensions.y - Y-coordinate
  * @param {number} dimensions.width - Width in pixels
  * @param {number} dimensions.height - Height in pixels
  * @returns {boolean} If object is a valid dimensions object, returns true
  */

	}, {
		key: '_validateDimensions',
		value: function _validateDimensions(dimensions) {
			return dimensions.hasOwnProperty('x') && dimensions.hasOwnProperty('y') && dimensions.hasOwnProperty('width') && dimensions.hasOwnProperty('height');
		}
	}]);

	return VizPure;
}();

exports.default = VizPure;