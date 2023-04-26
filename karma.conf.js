// Karma configuration
// Generated on Sun May 10 2020 17:41:31 GMT+0200 (sentraleuropeisk sommertid)
const gitserver = require('./test-browser/githttpserver.js');
gitserver.startServer();

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: 'test-browser',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'],


    // list of files / patterns to load in the browser
    files: [
      {pattern: 'lg2.*', included: false},
      {pattern: 'worker.js', included: false},
      {pattern: '**/*.spec.js'}
    ],

    // list of files / patterns to exclude
    exclude: [
    ],

    proxies: {
      '/testrepo.git': 'http://localhost:8080/testrepo.git',
      '/testremote.git': 'http://localhost:8080/testremote.git',
    },

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,
    browserNoActivityTimeout: 10000,

    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}