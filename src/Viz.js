import fs         from 'fs'
import path       from 'path'
import mkdirp     from 'mkdirp'
import rimraf     from 'rimraf'
import pixelmatch from 'pixelmatch'
import { PNG }    from 'pngjs'
import PNGCrop    from 'png-crop'
import Imagemin   from 'imagemin'
import webdriver  from 'selenium-webdriver';


class Viz {

  static PATHS = {
    TMP  : 'tmp',
    NEW  : 'new',
    DIFF : 'diff',
    REF  : 'reference'
  };

  // http://selenium.googlecode.com/git/docs/api/javascript/class_webdriver_Capabilities.html
  static DRIVERS = 'chrome,firefox,ie,ipad,iphone,opera,phantomjs,safari'.split(',')


  constructor(tag, driver = 'phantomjs', rootPath) {

    // Init Selenium webdriver if an instance was not supplied:
    if( typeof driver === 'string' ){
      if( ~Viz.DRIVERS.indexOf(driver) ){
        const capabilities = webdriver.Capabilities[driver]()
        driver = new webdriver.Builder().withCapabilities(capabilities).build();
      } else {
        throw `INVALID_WEBDRIVER_NAME: Unable to create a Selenium webdriver named "${driver}".`
      }
    }

    this.tag = tag
    this.driver = driver        // To expose Selenium webdriver instance, eg: viz.driver.get('http://www.foobar.com')
    this.Webdriver = webdriver  // To expose Selenium webdriver convenience methods, eg: viz.Webdriver.By.css(...)
    this.rootPath = rootPath
    this.createPaths()
  }

  visualise(name, element = false) {
    let tmpPath      = path.join(this.rootPath, Viz.PATHS.TMP,  `${this.tag}-${name}.png`)
    let refPath      = path.join(this.rootPath, Viz.PATHS.REF,  `${this.tag}-${name}.png`)
    let newPath      = path.join(this.rootPath, Viz.PATHS.NEW,  `${this.tag}-${name}.png`)
    let diffPath     = path.join(this.rootPath, Viz.PATHS.DIFF, `${this.tag}-${name}-diff.png`)
    let diffPathCopy = path.join(this.rootPath, Viz.PATHS.DIFF, `${this.tag}-${name}.png`)
    // Seems to be necessary to bind(this) to prevent error reading this.rootPath:
    const clean      = this.clean.bind(this)


    // Compare tmpPath against refPath and reject if different:
    const raiseIfMismatch = (tmpPath, newPath, diffPath) => {
      return this.compare(tmpPath, refPath, diffPath)
        .then(clean)
        .then(resultOfCompare => {
          if(resultOfCompare > 0) {
            throw `VISUAL_MATCH_FAIL: The pages and/or elements do not match. A diff has been created at:\n${diffPath}`
          } else {
            return true
          }
        })
    }

    // Move image from tmp to new folder and raise error to draw attention to missing reference image:
    const raiseNewImageErr = (tmpPath, newPath) => {
      return this.move(tmpPath, newPath)
        .then(this.optimise)
        .then(clean)
        .then(result => {
          throw `NO_REFERENCE_ERROR: There is no reference image. Screenshot has been moved to:\n${newPath}`
        })
    }

    // Helper to make the promise chain more readable.
    const cropIfNecessary = (result) => {
      return new Promise( (resolve, reject) => {
        if(element) {
          return this.getDimensions(element)
            .then(dimensions => this.crop(tmpPath, tmpPath, dimensions))
            .then(() => resolve(tmpPath))
        } else {
          resolve(tmpPath)
        }
      })
    }

    // Helper to make the promise chain more readable.
    const lookForRefImage = () => {
      return this.exists(refPath)
    }


    // Capture and compare new screenshot:
    return this.capture(name)
      .then( cropIfNecessary )
      .then( lookForRefImage )
      .then( hasReference => {
        if (hasReference) {
          return raiseIfMismatch(tmpPath, refPath, diffPath)
        } else {
          return raiseNewImageErr(tmpPath, newPath)
        }
      })

  }

  // Grab screenshot and save it to tmp folder: (Returns the new path)
  capture(name) {
    return new Promise( (resolve, reject) => {
      this.driver.takeScreenshot().then( (data) => {
        const image = data.replace(/^data:image\/png;base64,/,'')
        const tmpPath = path.join(this.rootPath, Viz.PATHS.TMP, `${this.tag}-${name}.png`)
        fs.writeFile(tmpPath, image, 'base64', err => {
          if(err) reject(err)
          else resolve(tmpPath)
        })
      })
    })
  }

  crop(inputPath, outputPath, dimensions) {
    return new Promise((resolve, reject) => {
      PNGCrop.cropToStream(inputPath, dimensions, (err, stream) => {
        if(err) reject(err)
        else stream.pipe(fs.createWriteStream(outputPath)).on( 'finish', () => resolve(true) )
      })
    })
  }

  getDimensions(element) {
    let left, top, width, height;
    return new Promise((resolve, reject) => {
      element.getLocation().then((location) => {
        left = location.x
        top = location.y
        return element.getSize()
      }).catch((err) => {
        reject(err)
      }).then((dimensions) => {
        resolve({width: dimensions.width, height: dimensions.height, top, left})
      }).catch((err) => {
        reject(err)
      })
    })
  }

  compare(screenshotPath, refPath, diffPath, threshold = 0.1) {
    return Promise.all([screenshotPath, refPath].map((imagePath) => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(imagePath).pipe(new PNG()).on('parsed', function (data) {
          resolve(this);
        })
      })
    }))
    .then((images) => {
      let width      = images[0].width
      let height     = images[0].height
      let diffOutput = new PNG({ width: width, height: height })

      return new Promise((resolve, reject) => {
        let result = pixelmatch(images[0].data, images[1].data, diffOutput.data, width, height, { threshold: threshold })

        if(result > 0) {
          diffOutput.pack().pipe(fs.createWriteStream(diffPath)).on('finish', () => {
            resolve(result)
          })
        } else {
          resolve(result)
        }
      })
    })
  }

  // Create all the image folders:
  createPaths () {
    return Promise.all(Object.keys(Viz.PATHS).map((key) => {
      return this.createPath(path.join(this.rootPath, Viz.PATHS[key]))
    }))
  }

  // Create an image folder:
  createPath (targetPath) {
    return new Promise((resolve, reject) => mkdirp(targetPath, (err) => err ? reject(err) : resolve(targetPath)))
  }

  exists (sourcePath) {
    try {
      return new Promise((resolve, reject) => fs.stat(sourcePath, (err, stats) => err ? resolve(false) : resolve(stats.isFile() || stats.isDirectory())))
    } catch(e) {
      resolve(false)
    }
  }

  move (sourcePath, targetPath) {
    return new Promise((resolve, reject) => {
      try {
        fs.rename(sourcePath, targetPath, (err) => err ? reject(err) : resolve(targetPath))
      } catch (err) {
        reject(err)
      }
    })
  }

  // Empty the "tmp" folder: (Pass the current "result" argument through to the next promise)
  clean (result) {
    return new Promise((resolve, reject) => rimraf(path.join(this.rootPath, Viz.PATHS.TMP), fs, (err) => err ? reject(err) : resolve(result)))
  }


  // Shink image filesize: (Overwrites original file)
  // Note: to avoid wasted effort, this is only called when adding an image to the "new" folder.
  optimise (imagePath) {
    return new Promise((resolve, reject) => {
      // https://github.com/imagemin/imagemin
      // optipng options: https://github.com/imagemin/imagemin-optipng
      new Imagemin()
        .src(imagePath)
        .dest(path.dirname(imagePath))
        .use(Imagemin.optipng({ optimizationLevel : 2 }))
        .run((err, files) => {
          if (err) reject(err)
          else resolve(imagePath)
        });
    })
  }

}

export default Viz;
