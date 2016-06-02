import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'

/** A class implementing a storage object for VizJS using local storage */
class VizLocalStorage {
  /**
  * Creates an instance of VizLocalStorage and sets the root filesystem path
  * @param {string} rootPath - The root filesystem path to store images in, defaults 'screenshots' in current dir
  * @returns {VizLocalStorage} - Returns an instance of VizLocalStorage
  */
  constructor(rootPath = path.join(__dirname, 'screenshots')) {
    this.LABELS = {
      NEW: 'new',
      DIF: 'diff',
      REF: 'reference'
    }

    this.rootPath = rootPath
    this._createFolders()
    return this
  }

  /**
  * Allows VizJS to check it's being passed a valid VisJS Storage Object
  * @returns {boolean} Returns true becuase this is a valid storage obejct
  */
  isVizjsStorageObject() {
    return true
  }

  /**
  * Reads an image from local storage into a buffer and returns it
  * @param {string} imageTag - The uniquely identifying tag forming part of an image's filename
  * @param {string} label - The label (in this case folder) where the requested image is stored
  * @returns {Buffer} Returns a buffer containing the raw PNG data
  */
  read(imageTag, label) {
    return fs.readFileSync(path.join(this.rootPath, label, imageTag + '.png'))
  }

  /**
  * Writes an image from a buffer to local storage
  * @param {Buffer} imageData - Raw PNG image data stored in a buffer
  * @param {string} imageTag - The uniqely identifying tag formign part of the image's filename
  * @param {string} label - The label (in this case folder) where the requested image is stored
  */
  write(imageData, imageTag, label) {
    fs.writeFileSync(path.join(this.rootPath, label, imageTag + '.png'), imageData);
  }

  /**
  * Looks to see if an image exists
  * @param {string} imageTag - A string uniquely identifying the screenshot to check
  * @returns {boolean} A true or false depending if the file exists or not
  */
  exists(imageTag, label) {
    try {
      fs.accessSync(path.join(this.rootPath, label, imageTag + '.png'))
    } catch(err) {
      console.warn(err.stack);
      return false
    }

    return true
  }

  /**
  * Creates default folders within the root path for storing images
  * @returns {boolean} Returns true if all paths are created successfully
  */
  _createFolders() {
    for(let labelKey of Object.keys(this.LABELS)) {
      mkdirp.sync(path.join(this.rootPath, this.LABELS[labelKey]))
    }
  }
}

export default VizLocalStorage
