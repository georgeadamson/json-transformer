import fs from 'fs'
import pixelmatch from 'pixelmatch'
import {PNG} from 'pngjs'

/** Class for a Viz comparison object */
class Viz {
	/**
	 * Create an instance of Viz
	 * @param {object} storage - A Viz compatible Storage object
	 * @returns {Viz} A Viz object.
	 */
	constructor(storage) {
		if((typeof storage === 'undefined') || !storage.isVizjsStorageObject()) {
			throw new TypeError(`Expected VizPure constructor to be called with a storage
				object, got ${storage} instead.`)
		}
		this.storage = storage
	}

	/**
	* Compare an image against existing reference data (if available)
	* @param {Buffer} imageBuffer - A buffer containing raw PNG data
	* @param {string} imageTag - A string uniquely identifying the screenshot to be compared
	* @returns {boolean} A boolean representing a match or no-match result from the image comparison
	*/
	compare(imageBuffer, imageTag) {
		if(!Buffer.isBuffer(imageBuffer)) {
			throw new TypeError(`Expected imageBuffer to be of type <Buffer>, got ${typeof(imageBuffer)}`)
		}

		if(typeof imageTag !== 'string') {
			throw new TypeError(`Expected imageTag to be of type <string>, got ${typeof(imageTag)}`)
		}

		if(!this.storage.exists(imageTag, this.storage.LABELS.REF)) {
			this.storage.write(imageBuffer, imageTag, this.storage.LABELS.NEW)
			return false
		} else {
			let refImg = PNG.sync.read(this.storage.read(imageTag, this.storage.LABELS.REF))
			let testImg = PNG.sync.read(imageBuffer)
			let imgWidth = Math.min(refImg.width, testImg.width)
			let imgHeight = Math.min(refImg.height, testImg.height)
			let diffImg = new PNG({
				width: imgWidth,
				height: imgHeight
			})

			let diffPixels = pixelmatch(refImg.data, testImg.data, diffImg.data, imgWidth, imgHeight, {threshold: 0.1})

			this.storage.write(PNG.sync.write(diffImg), imageTag, this.storage.LABELS.DIF)

			return (diffPixels === 0)
		}
	}

	/**
	* Crop an image to the specified dimensions
	* @param {Buffer} imageBuffer - Buffer containing PNG image data
	* @param {Object} dimensions - The Dimensions to crop the image to
	* @param {number} dimensions.x - The x-coordinate to start cropping from
	* @param {number} dimensions.y - The y-coordinate to start cropping from
	* @param {number} dimensions.width - The number of pixels on the x axis to crop
	* @param {number} dimensions.height - The number of pixels on the y axis to crop
	* @returns {Buffer} A Buffer containing the cropped image data
	*/
	crop(imageBuffer = null, dimensions = null) {
		if(!Buffer.isBuffer(imageBuffer)) {
			throw new TypeError(`Expected imageBuffer to be of type <Buffer>, got ${imageBuffer}`)
		}
		if(!this._validateDimensions(dimensions)) {
			throw new TypeError(`Expected dimensions to be <Object> with properties 'x', 'y', 'width' and 'height'
				got ${dimensions}`)
		}

		let sourcePNG = PNG.sync.read(imageBuffer)
		let targetPNG = new PNG({width: dimensions.width, height: dimensions.height})

		PNG.bitblt(sourcePNG, targetPNG,
			dimensions.x,
			dimensions.y,
			dimensions.width,
			dimensions.height,0,0)

		return PNG.sync.write(targetPNG)
	}

	/**
	* Takes raw image data and returns a base64 encoded string
	* @param {Buffer} imageBuffer - A Buffer of raw png image data
	* @return {string} Base64 encoded PNG data
	*/
	base64Encode(imageBuffer) {
		if(!Buffer.isBuffer(imageBuffer)) {
			throw new TypeError(`Expected imageBuffer to be of type <Buffer>, got ${imageBuffer}`)
		}
		return imageBuffer.toString('base64')
	}

	/**
	* Takes base64 encoded PNG data and returns a raw image buffer
	* @param {string} imageData - A string of base64 encoded PNG image data
	* @return {Buffer} A buffer of raw PNG image data
	*/
	base64Decode(imageData) {
		if(typeof imageData !== 'string') {
			throw new TypeError(`Expected imageData to be of type <String>, got ${typeof imageData}`)
		}
		return new Buffer(imageData, 'base64')
	}

	/**
	* Check if the passed dimensions object is valid
	* @param {Object} dimensions - A Dimensions object
	* @param {number} dimensions.x - X-coordinate
	* @param {number} dimensions.y - Y-coordinate
	* @param {number} dimensions.width - Width in pixels
	* @param {number} dimensions.height - Height in pixels
	* @returns {boolean} If object is a valid dimensions object, returns true
	*/
	_validateDimensions(dimensions) {
		return (dimensions.hasOwnProperty('x') &&
						dimensions.hasOwnProperty('y') &&
						dimensions.hasOwnProperty('width') &&
						dimensions.hasOwnProperty('height'))
	}
}

export default Viz;
