/**
 * Utility functions for file handling
 */
const fs = require('fs');
const path = require('path');

/**
 * Read a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Object>} - Parsed JSON object
 */
function readJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

/**
 * Write a JSON file
 * @param {string} filePath - Path to the JSON file
 * @param {Object} data - Data to write
 * @returns {Promise<void>}
 */
function writeJsonFile(filePath, data) {
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFile(filePath, jsonData, 'utf8', (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Delete a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<void>}
 */
function deleteFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

/**
 * Create a directory if it doesn't exist
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<void>}
 */
function createDirectory(dirPath) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dirPath, { recursive: true }, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

module.exports = {
  readJsonFile,
  writeJsonFile,
  fileExists,
  deleteFile,
  createDirectory
};