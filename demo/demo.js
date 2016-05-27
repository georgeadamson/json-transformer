var path = require('path'),
    Viz = require('../src/index.js'),
    webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    creds = require('./creds');

var suiteName = 'homepage-demo',
    rootPath = path.join(__dirname, 'screenshots');

var driver, viz;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

describe('Homepage Demo', function() {
  xit('should screenshot Three hompage', function(done) {
    driver = new webdriver.Builder().
      withCapabilities(webdriver.Capabilities.phantomjs()).
      build();
    driver.manage().window().setSize(1024,768);
    driver.get('http://' + creds + '@test-staging-active.three.co.uk')

    viz = new Viz(suiteName, rootPath, driver);
    viz.run('homepage').then(done).catch((err) => {
      throw(err);
    })

    // done();
    //
    // driver.get('http://' + creds + '@test-staging-active.three.co.uk')
    // viz.visualise('homepage').then(function(result) {
    //   expect(result).toBe(true);
    // }).catch(function(err) {
    //   expect(err).toBeUndefined();
    // }).then(done);
  })
  // //
  it('should screenshot the Round CTA section', function(done) {
    driver = new webdriver.Builder().
      withCapabilities(webdriver.Capabilities.phantomjs()).
      build();
    driver.manage().window().setSize(1024,768);
    driver.get('http://' + creds + '@test-staging-active.three.co.uk')

    var element = driver.findElement(By.css('.roundcta-section'))

    viz = new Viz(suiteName, rootPath, driver);
    viz.run('roundcta', element).then(done).catch((err) => {
      console.log(err.stack);
    })
    //
    //
    //
    //
    // viz.visualise('roundcta', element).then(function(result) {
    //   expect(result).toBe(true);
    // }).catch(function(err) {
    //   expect(err).toBeUndefined();
    // }).then(done);
  })
})
