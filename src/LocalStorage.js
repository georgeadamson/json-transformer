import fs from 'fs'
import path from 'path'
import Stream from 'stream'
import mkdirp from 'mkdirp'

class LocalStorage {
  constructor(rootPath, suiteName, types) {
    this.rootPath = rootPath
    this.suiteName = suiteName
    this.types = types
    this._createPaths()
  }

  write(fileData, type, testName) {
    let filePath = path.join(this.rootPath, type, `${this.suiteName}-${testName}.png`)
    return new Promise((resolve, reject) => {
      if(fileData instanceof Stream) {
        fileData.pipe(fs.createWriteStream(filePath))
          .on('finish', () => resolve())
          .on('error', (err) => reject(err))
      } else {
        fs.writeFile(filePath, fileData, 'base64', (err) => {
          if(err) {
            reject(err)
          } else {
            resolve()
          }
        })
      }

    })
  }

  _createPaths() {
    Object.keys(this.types).forEach((key) => {
      mkdirp.sync(path.join(this.rootPath, this.types[key]))
    })
  }
}

export default LocalStorage
