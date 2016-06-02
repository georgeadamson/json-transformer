import Viz from '../src/index'

let storageObject = {
  isVizjsStorageObject: () => { return true },
  read: (imageTag, label) => { return new Buffer() },
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
      expect(() => {
        new Viz()
      }).toThrow()

      // It should throw an error if an invalid storage is passed
      expect(() => {
        new Viz({})
      }).toThrow()

      // It should not throw an error if a valid storage object is passed
      expect(() => {
        new Viz(storageObject)
      }).not.toThrow()
    })

    it('should return an instance of Viz', () => {
      expect(Viz.prototype.isPrototypeOf(new Viz(storageObject))).toBe(true)
    })
  })

  describe('#compare', () => {
    it('should exist', () => {
      let viz = new Viz(storageObject)
      expect(typeof viz.compare).toBe('function')
    })
  })

  describe('#crop', () => {
    it('should exist', () => {
      let viz = new Viz(storageObject)
      expect(typeof viz.crop).toBe('function')
    })
  })

  describe('#_base64Encode', () => {
    it('should exist', () => {
      let viz = new Viz(storageObject)
      expect(typeof viz._base64Encode).toBe('function')
    })
  })

  describe('#_base64Decode', () => {
    it('should exist', () => {
      let viz = new Viz(storageObject)
      expect(typeof viz._base64Decode).toBe('function')
    })
  })
})
