import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import { PNG } from 'pngjs';
import webdriver, { By } from 'selenium-webdriver';

import Viz from '../src/index.js';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

describe('Viz', function() {
  const testTag = 'test'
  const testPath = path.join(__dirname, 'test');
  const driver = new webdriver.Builder().
    withCapabilities(webdriver.Capabilities.phantomjs()).
    build();
  const viz = new Viz(testTag, driver, testPath);

  beforeEach(function() {
    driver.get('http://www.google.com');
    driver.manage().window().setSize(1100,1600);
  });

  it('should exist', function() {
    expect(Viz).not.toBe(null);
  });

  describe('#capture', function() {

    it('should exist', function() {
      expect(Viz).not.toBe(null);
    });

    it('should return a Promise', function() {
      expect(viz.capture('test').constructor.name).toEqual('Promise')
    });

    it('should save a PNG to the test folder', function(done) {
      let title = 'capture'
      return viz.capture(title).then(function(result) {
        let imagePath = path.join(testPath, Viz.PATHS.TMP, `${testTag}-${title}.png`)
        expect(result).toEqual(imagePath)
        return new Promise((resolve, reject) => {
          fs.stat(imagePath, (err, stats) => {
            if(err) reject(err)
            resolve(stats)
          })
        })
      }).then((stats) => {
        expect(stats.isFile()).toBe(true)
      }).catch(function(err) {
        expect(err).toBeUndefined()
      }).then(done)
    });
  });

  describe('#getDimensions', () => {
    it('should exist', () => {
      expect(viz.getDimensions).not.toBeUndefined()
    })

    it('should return a Promise', () => {
      expect(viz.getDimensions().constructor.name).toBe('Promise')
    })

    it('should resolve to {width, height, top, left}', (done) => {
      let element = driver.findElement(By.css('#hplogo'))
      viz.getDimensions(element).then((dimensions) => {
        expect(dimensions).not.toBeUndefined()
        expect(dimensions.width).toEqual(jasmine.any(Number))
        expect(dimensions.height).toEqual(jasmine.any(Number))
        expect(dimensions.top).toEqual(jasmine.any(Number))
        expect(dimensions.left).toEqual(jasmine.any(Number))
      }).catch((err) => {
        expect(err).toBeUndefined()
      }).then(done)
    })
  })

  describe('#crop', () => {
    let title = 'crop'
    let imagePath = path.join(__dirname, 'support', 'google.png')
    let outputPath = path.join(testPath, Viz.PATHS.TMP, `${testTag}-${title}.png`)
    let dimensions = { width: 200, height: 200, top: 200, left: 200 }

    it('should exist', () => {
      expect(viz.crop).not.toBeUndefined()
    })

    it('should return a Promise', () => {
      expect(viz.crop() instanceof Promise).toBe(true)
    })

    it('should resolve to true', (done) => {
      viz.crop(imagePath, outputPath, dimensions).then((result) => {
        expect(result).toEqual(true)
      }).catch((err) => {
        expect(err).toBeUndefined()
      }).then(done)
    })

    it('should return an image cropped to the correct dimensions', (done) => {
      viz.crop(imagePath, outputPath, dimensions).then(() => {
        let croppedImage = fs.createReadStream(outputPath).pipe(new PNG()).on('parsed', () => {
          expect(croppedImage.width).toEqual(dimensions.width)
          expect(croppedImage.height).toEqual(dimensions.height)
          done()
        })
      })
    })
  })

  describe('#compare', () => {
    let title = 'compare'
    let samplePath = path.join(__dirname, 'support', 'google-alt.png')
    let referencePath = path.join(__dirname, 'support', 'google.png')
    let outputPathMatch = path.join(testPath, Viz.PATHS.DIFF, `${testTag}-${title}-match.png`)
    let outputPathDiff = path.join(testPath, Viz.PATHS.DIFF, `${testTag}-${title}-diff.png`)

    it('should exist', () => {
      expect(viz.compare).not.toBeUndefined()
    })

    it('should return a Promise', () => {
      expect(viz.compare() instanceof Promise).toEqual(true)
    })

    it('should return "> 0" and create a "diff" file if images don\'t match', (done) => {
      viz.compare(samplePath, referencePath, outputPathDiff).then((result) => {
        expect(result).toBeGreaterThan(0)
      }).catch((err) => {
        expect(err).toBeUndefined()
      }).then(() => {
        fs.stat(outputPathDiff, (err, stats) => {
          expect(err).toBe(null)
          expect(stats.isFile()).toEqual(true)
          done()
        })
      })
    })

    it('should return "0" and not create a "diff" file if the images do match', (done) => {
      viz.compare(samplePath, samplePath, outputPathMatch).then((result) => {
        expect(result).toEqual(0)
      }).catch((err) => {
        expect(err).toBeUndefined()
      }).then(() => {
        fs.stat(outputPathMatch, (err, stats) => {
          expect(err).not.toBe(null)
          done()
        })
      })
    })
  })

  describe("#createPaths", function() {
    it('should exist', function() {
      expect(viz.createPaths).not.toBeUndefined()
    });

    it('should return a Promise', function() {
      expect(viz.createPaths(testPath).constructor.name).toEqual('Promise')
    });

    it('should resolve to an Array of paths', function(done) {
      viz.createPaths( testPath ).then(function(results) {
        expect(results.constructor.name).toEqual('Array');
        expect(results[0]).toEqual(path.join(testPath, Viz.PATHS.TMP))
        expect(results[1]).toEqual(path.join(testPath, Viz.PATHS.NEW))
        expect(results[2]).toEqual(path.join(testPath, Viz.PATHS.DIFF))
        expect(results[3]).toEqual(path.join(testPath, Viz.PATHS.REF))
        done();
      });
    });

    it('should create a path for each of "Viz.PATHS"', (done) => {
      Promise.all(Object.keys(Viz.PATHS).map((key) => {
        let vizPath = path.join(testPath, Viz.PATHS[key])
        return new Promise((resolve, reject) => {
          fs.stat(vizPath, (err, stats) => {
            expect(err).toEqual(null)
            expect(stats.isDirectory()).toEqual(true)
            resolve(true)
          })
        })
      })).then(done)
    })
  })

  // Tidy up!
  afterAll((done) => {
    rimraf(testPath, fs, () => done())
  })
});
