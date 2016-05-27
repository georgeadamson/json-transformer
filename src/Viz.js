import fs           from 'fs'
import path         from 'path'
import mkdirp       from 'mkdirp'
import rimraf       from 'rimraf'
import pixelmatch   from 'pixelmatch'
import { PNG }      from 'pngjs'
import PNGCrop      from 'png-crop'
import Imagemin     from 'imagemin'

import LocalStorage from './LocalStorage'


class Viz {
    TYPES = {
      TMP  : 'tmp',
      NEW  : 'new',
      DIFF : 'diff',
      REF  : 'reference'
    }

    constructor(suiteName, rootPath, driver, storage) {
      this.suiteName = suiteName
      this.rootPath = rootPath
      this.driver = driver
      this.storage = typeof(storage) === 'undefined' ? new LocalStorage(rootPath, suiteName, this.TYPES) : storage
    }

    run(testName, element) {
      return this.capture(testName).then(() => {
        return this.crop(element, this.TYPES.TMP, testName)
      })
    }

    capture(testName) {
      return new Promise((resolve, reject) => {
        this.driver.takeScreenshot().then((rawImage) => {
          console.log('Got image');
          let image = rawImage.replace(/^data:image\/png;base64,/,'')
          this.storage.write(image, this.TYPES.TMP, testName).then(() => {
            resolve()
          }).catch((err) => {
            reject(err);
          })
        })
      })
    }

    crop(element, type, testName) {
      return new Promise((resolve, reject) => {
        if(typeof(element) === 'undefined') {
          resolve()
        } else {
          this.getDimensions(element).then((dimensions) => {
            console.log(dimensions);
            let tmpPath = path.join(this.rootPath, type, `${this.suiteName}-${testName}.png`)
            PNGCrop.cropToStream(tmpPath, dimensions, (err, stream) => {
              console.log(typeof stream);
              if(err) reject(err)
              else this.storage.write(stream, type, testName).then(() => {
                resolve()
              })
            })
          }).catch((err) => {
            reject(err);
          })
        }
      })
    }

    getDimensions(element) {
      console.log('')
      let left, top, width, height;
      return new Promise((resolve, reject) => {
        // element = this.findElement(element)
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


    // crop(inputPath, outputPath, dimensions) {
    //   return new Promise((resolve, reject) => {
    //     PNGCrop.cropToStream(inputPath, dimensions, (err, stream) => {
    //       if(err) reject(err)
    //       // else stream.pipe(fs.createWriteStream(outputPath)).on( 'finish', () => resolve(true) )
    //       else {
    //         this.storage.write(stream, this.storage.TAGS.TMP, `${this.tag}-blah`).then((path) => {
    //           resolve(path);
    //         }).catch((err) => {
    //           reject(err);
    //         })
    //       }
    //     })
    //   })
    // }
}

export default Viz;
