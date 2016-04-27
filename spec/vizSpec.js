// import fs from 'fs';
import fs from 'node-fs-extra'; // https://github.com/jprichardson/node-fs-extra
import path from 'path';
import rimraf from 'rimraf';
import { PNG } from 'pngjs';
import customFileMatchers from './helpers/fileMatchers';

// This is what we're testing:
import Viz from '../src/index.js';


jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

describe('Viz', function() {
  const testTag  = 'test'
  const testPath = path.join(__dirname, 'spec-screenshots');
  const viz      = new Viz(testTag, 'phantomjs', testPath);

  // Diddy asynchronous helpers to DRY the spec code...
  function createPaths () {
    return viz.createPaths(testPath)
  }
  function destroyPaths () {
    return new Promise((resolve, reject) => {
      rimraf(testPath, fs, resolve)
    })
  }
  // Diddy synchronous helpers. Useful while writing tests...
  function fileExists(path){
    try { return fs.statSync(path).isFile() } catch(e) { return false }
  }


  beforeAll(function(){
    // Define some extra helpers for testing whether a file exists etc:
    jasmine.addMatchers(customFileMatchers)
  })

  // Tidy up!
  afterAll((done) => {
    destroyPaths().then(done)
  })

  beforeEach(function(done) {
    // const samplePage = 'http://www.google.com'                     // <-- Works but will require new sample image(s)
    const samplePage = path.join(__dirname, 'support', 'google.htm')  // <-- Use local file for faster test run.
    viz.driver.manage().window().setSize(1100,1600)
    viz.driver.get(samplePage)
    destroyPaths().then(createPaths).then(done)
  });


  it('should exist', function() {
    expect(Viz).not.toBe(null)
  });


  describe("#createPaths", function() {
    it('should exist', function() {
      expect(viz.createPaths).not.toBeUndefined()
    });

    // TODO: This test should complete asynchronously so it does not affect subsequent tests:
    xit('should return a Promise', function() {
      expect(viz.createPaths(testPath).constructor.name).toEqual('Promise')
    });

    it('should resolve to an Array of paths', function(done) {
      viz.createPaths( testPath ).then(function(results) {
        expect(results.constructor.name).toEqual('Array');
        expect(results[0]).toEqual(path.join(testPath, Viz.PATHS.TMP))
        expect(results[1]).toEqual(path.join(testPath, Viz.PATHS.NEW))
        expect(results[2]).toEqual(path.join(testPath, Viz.PATHS.DIFF))
        expect(results[3]).toEqual(path.join(testPath, Viz.PATHS.REF))
        done()
      })
    })

    it('should create a path for each of "Viz.PATHS"', (done) => {
      destroyPaths().then(function(){

        // Ensure they testPath does not exist before we test it's creation:
        expect(testPath).not.toFolderExist()

        viz.createPaths( testPath ).then(function(results) {
          Promise.all(Object.keys(Viz.PATHS).map((key) => {
            let vizPath = path.join(testPath, Viz.PATHS[key])
            return new Promise((resolve, reject) => {
              expect(vizPath).toFolderExist()
              resolve(true)
            })
          }))
          .then(done)
        })

      })
    })
  })


  describe('#exists', function() {

    it('should exist', () => {
      expect(viz.exists).not.toBeUndefined()
    })

    // TODO: This test should complete asynchronously so it does not affect subsequent tests:
    xit('should return a Promise', function() {
      expect(viz.exists('path/to/nonexistent/file').constructor.name).toEqual('Promise')
    });

    it('should return false if file does not exist', function(done) {
      viz.exists('path/to/nonexistent/file').then(function (result) {
        expect(result).toBe(false)
        done()
      })
    });

    it('should return true if file does exist', function(done) {
      const samplePath = path.join(__dirname, 'support', 'google.png')
      viz.exists(samplePath).then(function (result) {
        expect(result).toBe(true)
        done()
      })
    });

  })


  describe('#move', function() {

    const filePathA    = path.join(testPath, Viz.PATHS.TMP, 'a.txt')
    const filePathB    = path.join(testPath, Viz.PATHS.TMP, 'b.txt')
    const fileContentA = 'This is file A'

    beforeEach( function () { fs.writeFileSync(filePathA, fileContentA)    })
    afterEach ( function () { fs.remove(filePathA); fs.remove(filePathB) })

    it('should exist', () => {
      expect(viz.move).not.toBeUndefined()
    })

    // TODO: This test should complete asynchronously so it does not affect subsequent tests:
    xit('should return a Promise', function() {
      expect(viz.move('a','b').constructor.name).toEqual('Promise')
    });

    it('should have correct test data set up', function() {
      // Just belt and braces to ensure the beforeEach is doinf its stuff:
      expect( filePathA ).toFileExist()
      expect( filePathB ).not.toFileExist()
    });

    it('should move file from A to new path B', function(done) {
      viz.move(filePathA, filePathB).then(function(newPath) {
        expect( newPath ).toEqual(filePathB)
        expect( newPath ).toFileExist()
        expect( newPath ).toFileContain(fileContentA)
        done()
      })
    });

    it('should move file from A to overwrite B', function(done) {
      fs.writeFileSync(filePathB, 'This file should be overwritten')
      expect( filePathB ).toFileExist()

      viz.move(filePathA, filePathB).then(function(newPath) {
        expect( newPath ).toEqual(filePathB)
        expect( newPath ).toFileExist()
        expect( newPath ).toFileContain(fileContentA)
        done()
      })
    });

    it('should reject promise when moving a file that does not exist', function(done) {
      viz.move(filePathB, filePathA).then(function(result) {
        expect(result).toBe('a deliberate error message about "no such file or directory" instead')
        done();
      }).catch(function(err){
        expect( '' + err ).toContain('no such file or directory')
        done()
      })
    });

  });


  describe('#clean', function() {

    const filePathA = path.join(testPath, Viz.PATHS.TMP, 'a.txt')

    beforeEach( function () { fs.writeFileSync(filePathA, 'file contents') })
    afterEach ( function () { fs.remove(filePathA) })

    it('should exist', () => {
      expect(viz.clean).not.toBeUndefined()
    })

    // TODO: This test should complete asynchronously so it does not affect subsequent tests:
    xit('should return a Promise', function() {
      expect(viz.clean().constructor.name).toEqual('Promise')
    });

    it('should empty the tmp folder', function(done) {
      const argPassedIn = 'foobar'
      expect(filePathA).toFileExist()
      createPaths().then(function(results) {
        viz.clean(argPassedIn).then(function(result) {
          expect(result).toEqual(argPassedIn)
          expect(filePathA).not.toFileExist()
          done()
        })
      })
    });

  })


  describe('#capture', function() {

    const title = 'capture'

    // beforeEach( done => {
    //   destroyPaths()
    //   .then(createPaths)
    //   .then(done)
    // })

    it('should exist', () => {
      expect(viz.capture).not.toBeUndefined()
    })

    // TODO: This test should complete asynchronously so it does not affect subsequent tests:
    xit('should return a Promise', function() {
      expect(viz.capture(title).constructor.name).toEqual('Promise')
    });

    it('should save PNG to the "tmp" folder', function(done) {
      const tmpPath = path.join(testPath, Viz.PATHS.TMP, `${testTag}-${title}.png`)

      expect( tmpPath ).not.toFileExist()

      viz.capture(title).then(function(result) {
        expect(result).toEqual(tmpPath)
        expect(result).toFileExist()
        expect(result).not.toBeEmptyFile()
      })
      .catch(err => {
        expect(err).toBeUndefined()
      })
      .then(done)

    })

    it('should reject promise if the target folder does not exist', function(done) {
      const title      = 'capture'
      const tmpPath = path.join(testPath, Viz.PATHS.TMP, `${testTag}-${title}.png`)

      destroyPaths()
      expect( tmpPath ).not.toFileExist()

      return viz.capture(title).then(function(result) {
        expect(result).toBe('a deliberate error message about "no such file or directory" instead')
        done()
      })
      .catch(err => {
        expect( '' + err ).toContain('no such file or directory')
        done()
      })

    })

  })


  describe('#optimise', function() {

    // Helper for reading image file stats: (For size and isFile() etc)
    function getStats (imagePath) {
      return new Promise((resolve, reject) => {
        fs.stat(imagePath, (err, stats) => {
          if(err) reject(err); else resolve(stats)
        })
      })
    }

    it('should exist', () => {
      expect(viz.optimise).not.toBeUndefined()
    })

    // TODO: This test should complete asynchronously so it does not affect subsequent tests:
    xit('should return a Promise', function() {
      expect(viz.optimise().constructor.name).toEqual('Promise')
    });


    it('should shrink the size of a png file', function(done) {
      const title     = 'optimise'
      const imagePath = path.join(testPath, Viz.PATHS.TMP, `${testTag}-${title}.png`)
      let origFileSize

      fs.remove(imagePath)
      expect(imagePath).not.toFileExist()

      // Capture image and compare its size before/after optimisation:
      return viz.capture(title).then(function(result) {

        expect(result   ).toEqual(imagePath)
        expect(imagePath).toFileExist()
        return getStats(imagePath)

      })
      .then( (stats) => {

        expect( stats.isFile() ).toBe(true)
        expect( stats.size     ).toBeGreaterThan(0)

        origFileSize = stats.size
        return viz.optimise(imagePath).then(function(result){

          expect(result).toEqual(imagePath)
          expect(result).toFileExist()
          return getStats(result)

        })

      }).then( (newStats) => {

        expect( newStats.size ).toBeLessThan( origFileSize )

      })
      .catch(err => {
        expect(err).toBeUndefined()
      })
      .then(done)

    });

  });


  describe('#getDimensions', () => {
    const title = 'getDimensions'

    it('should exist', () => {
      expect(viz.getDimensions).not.toBeUndefined()
    })

    // TODO: This test should complete asynchronously so it does not affect subsequent tests:
    xit('should return a Promise', () => {
      expect(viz.getDimensions().constructor.name).toBe('Promise')
    })

    it('should resolve to {width, height, top, left}', (done) => {
      viz.capture(title).then(function(result) {
        let element = viz.driver.findElement(viz.Webdriver.By.css('#hplogo'))
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
  })


  describe('#crop', () => {
    let title = 'crop'
    let imagePath = path.join(__dirname, 'support', 'google.png')
    let outputPath = path.join(testPath, Viz.PATHS.TMP, `${testTag}-${title}.png`)
    let dimensions = { width: 200, height: 200, top: 200, left: 200 }

    it('should exist', () => {
      expect(viz.crop).not.toBeUndefined()
    })

    // TODO: This test should complete asynchronously so it does not affect subsequent tests:
    xit('should return a Promise', () => {
      expect(viz.crop().constructor.name).toBe('Promise')
    })

    it('should resolve to true', (done) => {
      viz.crop(imagePath, outputPath, dimensions).then((result) => {
        expect(result).toEqual(true)
      }).catch((err) => {
        expect(err).toBeUndefined()
      }).then(done)
    })

    // More info: https://github.com/niegowski/node-pngjs
    it('should return an image cropped to the correct dimensions', (done) => {
      viz.crop(imagePath, outputPath, dimensions).then(() => {
        fs.createReadStream(outputPath).pipe(new PNG()).on('parsed', function() {
          expect(this.width).toEqual(dimensions.width)
          expect(this.height).toEqual(dimensions.height)
        })
      }).catch((err) => {
        expect(err).toBeUndefined()
      }).then(done)
    })
  })


  describe('#compare', () => {
    const title = 'compare'
    const samplePath    = path.join(__dirname, 'support', 'google-alt.png')
    const referencePath = path.join(__dirname, 'support', 'google.png')
    const tmpPath       = path.join(testPath, Viz.PATHS.TMP, `${testTag}-${title}.png`)
    const refPath       = path.join(testPath, Viz.PATHS.REF, `${testTag}-${title}.png`)
    const matchPath     = path.join(testPath, Viz.PATHS.DIFF, `${testTag}-${title}-match.png`)
    const diffPath      = path.join(testPath, Viz.PATHS.DIFF, `${testTag}-${title}-diff.png`)

    it('should exist', () => {
      expect(viz.compare).not.toBeUndefined()
    })

    // TODO: This test should complete asynchronously so it does not affect subsequent tests:
    xit('should return a Promise', () => {
      expect(viz.compare().constructor.name).toBe('Promise')
    })

    it('should return "> 0" and create a "diff" file if images don\'t match', (done) => {
      // Set up test files:
      fs.copySync(samplePath,    tmpPath)
      fs.copySync(referencePath, refPath)

      // Belt and braces:
      expect(tmpPath).toFileExist()
      expect(refPath).toFileExist()
      expect(tmpPath).not.toBeEmptyFile()
      expect(refPath).not.toBeEmptyFile()

      viz.compare(tmpPath, refPath, diffPath)
        .then((result) => {
          expect(result).toBeGreaterThan(0)
        }).catch((err) => {
          expect(err).toBeUndefined()
        }).then(() => {
          expect( diffPath ).toFileExist()
        })
        .then(done)
    })

    it('should return "0" and not create a "diff" file if the images do match', (done) => {
      // Set up test files:
      fs.copySync(samplePath, tmpPath)
      fs.copySync(samplePath, refPath)

      // Belt and braces:
      expect(tmpPath).toFileExist()
      expect(refPath).toFileExist()
      expect(tmpPath).not.toBeEmptyFile()
      expect(refPath).not.toBeEmptyFile()

      viz.compare(tmpPath, refPath, matchPath)
        .then((result) => {
          expect(result).toEqual(0)
        }).catch((err) => {
          expect(err).toBeUndefined()
        }).then(() => {
          expect( matchPath ).not.toFileExist()
        })
        .then(done)
    })
  })


  describe('#visualise', function() {

    const title    = 'visualise'
    const tmpPath  = path.join(testPath, Viz.PATHS.TMP,  `${testTag}-${title}.png`)
    const newPath  = path.join(testPath, Viz.PATHS.NEW,  `${testTag}-${title}.png`)
    const refPath  = path.join(testPath, Viz.PATHS.REF,  `${testTag}-${title}.png`)
    const diffPath = path.join(testPath, Viz.PATHS.DIFF, `${testTag}-${title}-diff.png`)

    beforeEach( done => {
      destroyPaths()
      .then(createPaths)
      .then(done)
    })

    it('should exist', () => {
      expect(viz.visualise).not.toBeUndefined()
    })

    // TODO: This test should complete asynchronously so it does not affect subsequent tests:
    xit('should return a Promise', (done) => {
      expect(viz.visualise(title).constructor.name).toBe('Promise')
    })

    it('should save PNG to the "new" folder when reference image is missing', function(done) {
      // Make absolutely certain there's no old test files knocking about:
      expect( tmpPath ).not.toFileExist()
      expect( refPath ).not.toFileExist()
      expect( newPath ).not.toFileExist()

      viz.visualise(title).then(function(result) {
        // Unexpected outcome:
        expect(result).toBe('a deliberate error message about NO_REFERENCE_ERROR instead')
      }).catch(function(err){
        // Expected outcome:
        expect( '' + err ).toContain('NO_REFERENCE_ERROR')
        expect( newPath  ).toFileExist()
      })
      .then(done)
    });

    it('should match PNG with identical image in the "reference" folder', function(done) {

      expect( refPath ).not.toFileExist()

      // Setup test files:
      fs.copySync(path.join(__dirname, 'support', 'google.htm.png'), refPath)
      expect( tmpPath ).not.toFileExist()
      expect( newPath ).not.toFileExist()
      expect( newPath ).toBeEmptyFile()
      expect( refPath ).toFileExist()
      expect( refPath ).not.toBeEmptyFile()

      // Now we're finally ready to test the visualise method:
      viz.visualise(title).then( result => {
        expect( result  ).toBe(true)
        expect( refPath ).toFileExist()
      })

      // Unexpected outcome.
      .catch(function(err){
        expect(err).toBe('not an error from the visualise method')
      })
      .then(done)

    });

    it('should reject PNG with different image in the "reference" folder', function(done) {

      expect( refPath ).not.toFileExist()

      // Setup test files:
      fs.copySync(path.join(__dirname, 'support', 'google-alt.png'), refPath)
      expect( tmpPath ).not.toFileExist()
      expect( newPath ).not.toFileExist()
      expect( newPath ).toBeEmptyFile()
      expect( refPath ).toFileExist()
      expect( refPath ).not.toBeEmptyFile()

      // Now we're finally ready to test the visualise method:
      viz.visualise(title).then( result => {
        // Unexpected outcome:
        expect(result).toBe('a deliberate error message about NO_REFERENCE_ERROR instead')
      }).catch(function(err){
        // Expected outcome:
        expect( '' + err ).toContain('VISUAL_MATCH_FAIL')
        expect( diffPath ).toFileExist()
        expect( diffPath ).not.toBeEmptyFile()
      })
      .then(done)

    });

    it('should save element PNG to the "new" folder when reference image is missing', function(done) {
      // Make absolutely certain there's no old test files knocking about:
      expect( tmpPath ).not.toFileExist()
      expect( refPath ).not.toFileExist()
      expect( newPath ).not.toFileExist()

      const element = viz.driver.findElement(viz.Webdriver.By.css('.jsb'))

      viz.visualise(title, element).then(function(result) {
        // Unexpected outcome:
        expect(result).toBe('a deliberate error message about NO_REFERENCE_ERROR instead')
      }).catch(function(err){
        // Expected outcome:
        expect( '' + err ).toContain('NO_REFERENCE_ERROR')
        expect( newPath  ).toFileExist()
      })
      .then(done)
    });

    it('should match element PNG with identical image in the "reference" folder', function(done) {

      expect( refPath ).not.toFileExist()

      // Setup MATCHING reference image:
      fs.copySync(path.join(__dirname, 'support', 'google.htm.element.png'), refPath)
      expect( tmpPath ).not.toFileExist()
      expect( newPath ).not.toFileExist()
      expect( newPath ).toBeEmptyFile()
      expect( refPath ).toFileExist()
      expect( refPath ).not.toBeEmptyFile()

      const element = viz.driver.findElement(viz.Webdriver.By.css('.jsb'))

      // Now we're finally ready to test the visualise method:
      viz.visualise(title, element).then( result => {
        expect( result  ).toBe(true)
        expect( refPath ).toFileExist()
      })

      // Unexpected outcome.
      .catch(function(err){
        expect(err).toBe('not an error from the visualise method')
      })
      .then(done)

    });

    it('should reject PNG with different image in the "reference" folder', function(done) {

      expect( refPath ).not.toFileExist()

      // Setup DIFFERING reference image:
      fs.copySync(path.join(__dirname, 'support', 'google-alt.png'), refPath)
      expect( tmpPath ).not.toFileExist()
      expect( newPath ).not.toFileExist()
      expect( newPath ).toBeEmptyFile()
      expect( refPath ).toFileExist()
      expect( refPath ).not.toBeEmptyFile()

      const element = viz.driver.findElement(viz.Webdriver.By.css('.jsb'))

      // Now we're finally ready to test the visualise method:
      viz.visualise(title, element).then( result => {
        // Unexpected outcome:
        expect(result).toBe('a deliberate error message about NO_REFERENCE_ERROR instead')
      }).catch(function(err){
        // Expected outcome:
        expect( '' + err ).toContain('VISUAL_MATCH_FAIL')
        expect( diffPath ).toFileExist()
        expect( diffPath ).not.toBeEmptyFile()
      })
      .then(done)

    });

    it('should also allow an element to be specified vis a selector string', function(done) {
      // Make absolutely certain there's no old test files knocking about:
      expect( tmpPath ).not.toFileExist()
      expect( refPath ).not.toFileExist()
      expect( newPath ).not.toFileExist()

      // const element = viz.driver.findElement(viz.Webdriver.By.css('.jsb'))
      const element = '.jsb'

      viz.visualise(title, element).then(function(result) {
        // Unexpected outcome:
        expect(result).toBe('a deliberate error message about NO_REFERENCE_ERROR instead')
      }).catch(function(err){
        // Expected outcome:
        expect( '' + err ).toContain('NO_REFERENCE_ERROR')
        expect( newPath  ).toFileExist()
      })
      .then(done)
    });

  });

});
