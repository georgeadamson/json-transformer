import fs from 'fs';

var customFileMatchers = {

  toFileExist : function (util, customEqualityTesters) {

    function fileExists(path){
      try { return fs.statSync(path).isFile() } catch(e){ return false }
    }

    return {
      compare: function (actual, expected) {

        var result = {}
        expected = true // Default because there's no need to provide expected value for this test

        // result.pass = util.equals( fileExists(actual), expected, customEqualityTesters )
        result.pass = fileExists(actual) === expected

        if (result.pass) {
          result.message = `Expected file to not exist: ${actual}` // For .not.toFileExist()
        } else {
          result.message = `Expected file to exist: ${actual}`
        }

        return result
      }
    }

  },


  toFolderExist : function (util, customEqualityTesters) {

    function folderExists(path){
      try { return fs.statSync(path).isDirectory() } catch(e){ return false }
    }

    return {
      compare: function (actual, expected) {

        var result = {}
        expected = true // Default because there's no need to provide expected value for this test

        // result.pass = util.equals( folderExists(actual), expected, customEqualityTesters )
        result.pass = folderExists(actual) === expected

        if (result.pass) {
          result.message = `Expected folder to not exist: ${actual}`; // For .not.toFolderExist()
        } else {
          result.message = `Expected folder to exist: ${actual}`;
        }

        return result
      }
    }

  },


  toBeEmptyFile : function (util, customEqualityTesters) {

    function fileSize(path){
      try { return fs.statSync(path).size } catch(e){ return 0 }
    }

    return {
      compare: function (actual, expected) {

        var result = {}
        var actualSize = fileSize(actual)
        expected = 0


        // result.pass = util.equals( fileExists(actual), expected, customEqualityTesters )
        result.pass = actualSize === expected

        if (result.pass) {
          result.message = `Expected file to not be empty: (${actualSize} bytes) ${actual}` // For .not.toBeEmptyFile()
        } else {
          result.message = `Expected file to be empty: (${actualSize} bytes) ${actual}`
        }

        return result
      }
    }

  },


  toFileContain : function (util, customEqualityTesters) {

    function fileContents(path){
      try { return fs.readFileSync(path,'utf-8') } catch(e){ return undefined }
    }

    return {
      compare: function (actual, expected) {

        var result = {}

        // result.pass = util.equals( fileExists(actual), expected, customEqualityTesters )
        result.pass = fileContents(actual) === expected

        if (result.pass) {
          result.message = `Expected file to not contain: ${actual}` // For .not.toFileContain()
        } else {
          result.message = `Expected file to contain: ${actual}`
        }

        return result
      }
    }

  }

}

export default customFileMatchers;