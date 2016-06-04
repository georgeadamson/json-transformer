import fs from 'fs'
import path from 'path'
import Viz from '../src/index'

const imageBuffer = fs.readFileSync(path.join(__dirname, 'support', 'blackadder.png'))
const imageBufferError = fs.readFileSync(path.join(__dirname, 'support', 'blackadder-error.png'))
const storageObject = {
  LABELS: { REF: 'ref', DIF: 'dif', NEW: 'new' },
  isVizjsStorageObject: () => { return true },
  read: (imageTag, label) => { return imageBuffer },
  write:(imageData, imageTag, label) => {},
  exists: (imageTag, label) => { return true }
}

describe('Viz', function() {
  it('should exist', () => {
    expect(Viz).not.toBe(null)
  })

  describe('constructor', () => {
    it('should require valid storage Object', () => {
      // It should throw an error if no storage object is passed
      expect(() => { new Viz() }).toThrow()

      // It should throw an error if an invalid storage is passed
      expect(() => { new Viz({}) }).toThrow()

      // It should not throw an error if a valid storage object is passed
      expect(() => { new Viz(storageObject) }).not.toThrow()
    })

    it('should return an instance of Viz', () => {
      expect(Viz.prototype.isPrototypeOf(new Viz(storageObject))).toBe(true)
    })
  })

  describe('#compare', () => {
    let viz = new Viz(storageObject)
    let imageTag = 'aUniqueTag'

    it('should exist', () => {
      expect(typeof viz.compare).toBe('function')
    })

    it('should require a imageData<Buffer> and imageTag<string> as input', () => {
      expect(() => { viz.compare() }).toThrow()
      expect(() => { viz.compare(imageBuffer) }).toThrow()
      expect(() => { viz.compare(imageTag) }).toThrow()
      expect(() => { viz.compare(null, imageTag) }).toThrow()
      expect(() => { viz.compare(imageBuffer, new Array())}).toThrow()
      expect(() => { viz.compare(imageBuffer, imageTag) }).not.toThrow()
    })

    it('should return false if the images don\'t match', () => {
      expect(viz.compare(imageBufferError, imageTag)).toBe(false)
    })
  })

  describe('#crop', () => {
    it('should exist', () => {
      let viz = new Viz(storageObject)
      expect(typeof viz.crop).toBe('function')
    })
  })

  describe('#base64Encode', () => {
    it('should exist', () => {
      let viz = new Viz(storageObject)
      expect(typeof viz.base64Encode).toBe('function')
    })
  })

  describe('#base64Decode', () => {
    it('should exist', () => {
      let viz = new Viz(storageObject)
      expect(typeof viz.base64Decode).toBe('function')
    })
  })

  describe("#_validateDimensions", () => {
    it('should exist', () => {
      let viz = new Viz(storageObject)
      expect(typeof viz._validateDimensions).toBe('function')
    })
  })
})
