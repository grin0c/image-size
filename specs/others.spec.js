'use strict';

var expect = require('expect.js');
var path = require('path');
var fs = require('fs');

var imageSize = require('..');

// If something other than a buffer or filepath is passed
describe('Invalid invocation', function () {

  describe('invalid type', function () {
    it('should throw', function() {
      expect(imageSize.bind(null, {})).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
        expect(e.message).to.be('invalid invocation');
      });
    });
  });

  describe('non existant file', function () {
    it('should throw', function() {
      expect(imageSize.bind(null, '/monkey/man/yo')).to.throwException(function (e) {
        // expect(e.errno).to.be(34);
        expect(e.code).to.be('ENOENT');
      });
    });
  });

});

describe('Callback function', function () {
  it('should be called only once', function(done) {
    var tmpError = new Error();

    var origException = process.listeners('uncaughtException').pop();
    process.removeListener('uncaughtException', origException);
    process.once('uncaughtException', function (err) {
      expect(err).to.be(tmpError);
    });

    imageSize('specs/images/valid/jpg/sample.jpg', function() {
      process.nextTick(function () {
        done();
      });
      throw tmpError;
    });
  });
});

describe('.types property', function () {
  it('should expose supported file types', function() {
    expect(imageSize.types).to.eql(['bmp', 'cur', 'dds', 'gif', 'ico', 'jpg', 'png', 'psd', 'svg', 'tiff', 'webp']);
  });
});
