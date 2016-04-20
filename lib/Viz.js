'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _pixelmatch = require('pixelmatch');

var _pixelmatch2 = _interopRequireDefault(_pixelmatch);

var _pngjs = require('pngjs');

var _pngCrop = require('png-crop');

var _pngCrop2 = _interopRequireDefault(_pngCrop);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Viz = function () {
  function Viz(tag, driver, rootPath) {
    _classCallCheck(this, Viz);

    this.tag = tag;
    this.driver = driver;
    this.rootPath = rootPath;
    this.createPaths();
  }

  _createClass(Viz, [{
    key: 'visualise',
    value: function visualise(name) {
      var _this = this;

      var element = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      var tmpPath = _path2.default.join(this.rootPath, Viz.PATHS.TMP, this.tag + '-' + name + '.png');
      var refPath = _path2.default.join(this.rootPath, Viz.PATHS.REF, this.tag + '-' + name + '.png');
      var newPath = _path2.default.join(this.rootPath, Viz.PATHS.NEW, this.tag + '-' + name + '.png');
      var diffPath = _path2.default.join(this.rootPath, Viz.PATHS.DIFF, this.tag + '-' + name + '-diff.png');
      var diffPathCopy = _path2.default.join(this.rootPath, Viz.PATHS.DIFF, this.tag + '-' + name + '.png');
      return new Promise(function (resolve, reject) {
        _this.capture(name).then(function (result) {
          if (element) {
            return _this.getDimensions(element).then(function (dimensions) {
              return _this.crop(tmpPath, tmpPath, dimensions);
            });
          } else {
            return true;
          }
        }).then(function () {
          return _this.exists(refPath);
        }).then(function (hasReference) {
          if (hasReference) {
            _this.compare(tmpPath, refPath, diffPath).then(function (result) {
              _this.clean().then(function () {
                if (result > 0) {
                  reject(new Error('\n\nVISUAL_MATCH_FAIL: The pages and/or elements do not. A diff has been created at:\n' + diffPath + '\n\n'));
                } else {
                  resolve(true);
                }
              });
            });
          } else {
            _this.move(tmpPath, newPath).then(function () {
              _this.clean().then(function () {
                reject(new Error('\n\nNO_REFERENCE_ERROR: There is no reference image. Screenshot has been moved to:\n' + newPath + '\n\n'));
              });
            });
          }
        });
      });
    }
  }, {
    key: 'capture',
    value: function capture(name) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.driver.takeScreenshot().then(function (data) {
          var image = data.replace(/^data:image\/png;base64,/, '');
          var imagePath = _path2.default.join(_this2.rootPath, Viz.PATHS.TMP, _this2.tag + '-' + name + '.png');
          _fs2.default.writeFile(imagePath, image, 'base64', function (err) {
            if (err) reject(err);
            resolve(imagePath);
          });
        });
      });
    }
  }, {
    key: 'crop',
    value: function crop(inputPath, outputPath, dimensions) {
      return new Promise(function (resolve, reject) {
        _pngCrop2.default.cropToStream(inputPath, dimensions, function (err, stream) {
          if (err) reject(err);
          stream.pipe(_fs2.default.createWriteStream(outputPath)).on('finish', function () {
            return resolve(true);
          });
        });
      });
    }
  }, {
    key: 'getDimensions',
    value: function getDimensions(element) {
      var left = void 0,
          top = void 0,
          width = void 0,
          height = void 0;
      return new Promise(function (resolve, reject) {
        element.getLocation().then(function (location) {
          left = location.x;
          top = location.y;

          return element.getSize();
        }).catch(function (err) {
          reject(err);
        }).then(function (dimensions) {
          resolve({ width: dimensions.width, height: dimensions.height, top: top, left: left });
        }).catch(function (err) {
          reject(err);
        });
      });
    }
  }, {
    key: 'compare',
    value: function compare(screenshot, reference, diff) {
      return Promise.all([screenshot, reference].map(function (image) {
        return new Promise(function (resolve, reject) {
          var imageObj = _fs2.default.createReadStream(image).pipe(new _pngjs.PNG()).on('parsed', function (data) {
            resolve(imageObj);
          });
        });
      })).then(function (images) {
        var width = images[0].width;
        var height = images[0].height;
        var diffOutput = new _pngjs.PNG({ width: width, height: height });

        return new Promise(function (resolve, reject) {
          var result = (0, _pixelmatch2.default)(images[0].data, images[1].data, diffOutput.data, width, height, { threshold: 0.1 });

          if (result > 0) {
            diffOutput.pack().pipe(_fs2.default.createWriteStream(diff)).on('finish', function () {
              resolve(result);
            });
          } else {
            resolve(result);
          }
        });
      });
    }
  }, {
    key: 'createPaths',
    value: function createPaths() {
      var _this3 = this;

      return Promise.all(Object.keys(Viz.PATHS).map(function (key) {
        return _this3.createPath(_path2.default.join(_this3.rootPath, Viz.PATHS[key]));
      }));
    }
  }, {
    key: 'createPath',
    value: function createPath(targetPath) {
      return new Promise(function (resolve, reject) {
        return (0, _mkdirp2.default)(targetPath, function (err) {
          return err ? reject(err) : resolve(targetPath);
        });
      });
    }
  }, {
    key: 'exists',
    value: function exists(sourcePath) {
      return new Promise(function (resolve, reject) {
        return _fs2.default.stat(sourcePath, function (err, stats) {
          return err ? resolve(false) : resolve(stats.isFile() || stats.isDirectory());
        });
      });
    }
  }, {
    key: 'move',
    value: function move(sourcePath, targetPath) {
      return new Promise(function (resolve, reject) {
        return _fs2.default.rename(sourcePath, targetPath, function (err) {
          return err ? reject(err) : resolve(true);
        });
      });
    }
  }, {
    key: 'clean',
    value: function clean() {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        return (0, _rimraf2.default)(_path2.default.join(_this4.rootPath, Viz.PATHS.TMP), _fs2.default, function () {
          return resolve();
        });
      });
    }
  }]);

  return Viz;
}();

Viz.PATHS = {
  TMP: 'tmp',
  NEW: 'new',
  DIFF: 'diff',
  REF: 'reference'
};
exports.default = Viz;