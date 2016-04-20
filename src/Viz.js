import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import PNGCrop from 'png-crop'

class Viz {
  static PATHS = {
      TMP: 'tmp',
      NEW: 'new',
      DIFF: 'diff',
      REF: 'reference'
  };

  constructor(tag, driver, rootPath) {
    this.tag = tag
    this.driver = driver
    this.rootPath = rootPath
    this.createPaths()
  }

  visualise(name, element = false) {
    let tmpPath = path.join(this.rootPath, Viz.PATHS.TMP, `${this.tag}-${name}.png`)
    let refPath = path.join(this.rootPath, Viz.PATHS.REF, `${this.tag}-${name}.png`)
    let newPath = path.join(this.rootPath, Viz.PATHS.NEW, `${this.tag}-${name}.png`)
    let diffPath = path.join(this.rootPath, Viz.PATHS.DIFF, `${this.tag}-${name}-diff.png`)
    let diffPathCopy = path.join(this.rootPath, Viz.PATHS.DIFF, `${this.tag}-${name}.png`)
    return new Promise((resolve, reject) => {
      this.capture(name).then((result) => {
        if(element) {
          return this.getDimensions(element).then((dimensions) => {
            return this.crop(tmpPath, tmpPath, dimensions)
          })
        } else {
          return true
        }
      }).then(() => {
        return this.exists(refPath)
      }).then((hasReference) => {
        if(hasReference) {
          this.compare(
            tmpPath,
            refPath,
            diffPath
          ).then((result) => {
            this.clean().then(() => {
              if(result > 0) {
                reject(new Error(`\n\nVISUAL_MATCH_FAIL: The pages and/or elements do not. A diff has been created at:\n${diffPath}\n\n`))
              } else {
                resolve(true)
              }
            })
          })
        } else {
          this.move(tmpPath, newPath).then(() => {
            this.clean().then(() => {
              reject(new Error(`\n\nNO_REFERENCE_ERROR: There is no reference image. Screenshot has been moved to:\n${newPath}\n\n`))
            })
          })
        }
      })
    })
  }

  capture(name) {
    return new Promise( (resolve, reject) => {
      this.driver.takeScreenshot().then( (data) => {
        let image = data.replace(/^data:image\/png;base64,/,'')
        let imagePath = path.join(this.rootPath, Viz.PATHS.TMP, `${this.tag}-${name}.png`)
        fs.writeFile(imagePath, image, 'base64', (err) => {
          if(err) reject(err)
          resolve(imagePath)
        })
      })
    })
  }

  crop(inputPath, outputPath, dimensions) {
    return new Promise((resolve, reject) => {
      PNGCrop.cropToStream(inputPath, dimensions, (err, stream) => {
        if(err) reject(err)
        stream.pipe(fs.createWriteStream(outputPath)).on('finish', () => resolve(true))
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

  compare(screenshot, reference, diff) {
    return Promise.all([screenshot, reference].map((image) => {
        return new Promise((resolve, reject) => {
          let imageObj = fs.createReadStream(image).pipe(new PNG()).on('parsed', (data) => {
            resolve(imageObj);
          })
        })
    })).then((images) => {
      let width = images[0].width
      let height = images[0].height
      let diffOutput = new PNG({width: width, height: height})

      return new Promise((resolve, reject) => {
        let result = pixelmatch(images[0].data, images[1].data, diffOutput.data, width, height, {threshold: 0.1})

        if(result > 0) {
          diffOutput.pack().pipe(fs.createWriteStream(diff)).on('finish', () => {
            resolve(result)
          })
        } else {
          resolve(result)
        }
      })
    })
  }

  createPaths() {
    return Promise.all(Object.keys(Viz.PATHS).map((key) => {
      return this.createPath(path.join(this.rootPath, Viz.PATHS[key]))
    }))
  }

  createPath(targetPath) {
    return new Promise((resolve, reject) => mkdirp(targetPath, (err) => err ? reject(err) : resolve(targetPath)))
  }

  exists(sourcePath) {
    return new Promise((resolve, reject) => fs.stat(sourcePath, (err, stats) => err ? resolve(false) : resolve(stats.isFile() || stats.isDirectory())))
  }

  move(sourcePath, targetPath) {
    return new Promise((resolve, reject) => fs.rename(sourcePath, targetPath, (err) => err ? reject(err) : resolve(true)))
  }

  clean() {
    return new Promise((resolve, reject) => rimraf(path.join(this.rootPath, Viz.PATHS.TMP), fs, () => resolve()))
  }
}

export default Viz;
