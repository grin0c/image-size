'use strict';

// based on http://www.compix.com/fileformattif.htm
// TO-DO: support big-endian as well

var readUInt = require('../readUInt');

function isTIFF (buffer) {
  return determineEndianness(buffer);
}

// Expose helper method
isTIFF.startIFD = startIFD;

function startIFD (buffer, isBigEndian) {
  return readUInt(buffer, 32, 4, isBigEndian);
}

// Expose helper method
isTIFF.rangeIFD = rangeIFD;

function rangeIFD (buffer, isBigEndian) {
  var ifdDirEntries = readUInt(buffer, 16, 0, isBigEndian);
  return [2, 2 + ifdDirEntries * 12];
}

// Read IFD (image-file-directory) into a buffer
function readIFD (buffer, isBigEndian) {
  var ifdOffset = startIFD(buffer, isBigEndian);
  buffer = buffer.slice(ifdOffset);
  var ifdRange = rangeIFD(buffer, isBigEndian);
  return buffer.slice.apply(buffer, ifdRange);
}

// TIFF values seem to be messed up on Big-Endian, this helps
function readValue (buffer, isBigEndian) {
  var low = readUInt(buffer, 16, 8, isBigEndian);
  var high = readUInt(buffer, 16, 10, isBigEndian);
  return (high << 16) + low;
}

// move to the next tag
function nextTag (buffer) {
  return buffer.slice(12);
}

// Expose helper method
isTIFF.dimensions = extractWHTags;

// Extract IFD tags from TIFF metadata
function extractWHTags (buffer, isBigEndian) {
  var code, result = {};

  while (buffer && buffer.length) {
    code = readUInt(buffer, 16, 0, isBigEndian);
    // 256 is width, 257 is height
    if (result.width && result.height) {
      break; 
    } else {
      if (code === 256) {
        result.width = readValue(buffer, isBigEndian);
      } else if (code === 257) {
        result.height = readValue(buffer, isBigEndian);
      }
    }
    // move to the next tag
    buffer = nextTag(buffer);
  }
  return result;
}

// Expose helper method
isTIFF.bigEndian = bigEndian;

function bigEndian (buffer) {
  return determineEndianness(buffer) === 'BE';
}

// Test if the TIFF is Big Endian or Little Endian
function determineEndianness (buffer) {
  buffer = buffer.toString('hex', 0, 4);
  if ('49492a00' === buffer) {
    return 'LE';
  } else if ('4d4d002a' === buffer) {
    return 'BE';
  }
}

function calculate (buffer) {
  // Determine BE/LE
  var isBigEndian = bigEndian(buffer);

  // read the IFD
  var ifdBuffer = readIFD(buffer, isBigEndian);

  // extract the width and height from the IFD
  var dimensions = extractWHTags(ifdBuffer, isBigEndian);

  if (!dimensions.width || !dimensions.height) {
    throw new TypeError('Invalid Tiff, missing tags');
  }

  return dimensions;
}

module.exports = {
  'detect': isTIFF,
  'calculate': calculate
};
