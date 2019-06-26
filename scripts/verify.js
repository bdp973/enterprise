#!/usr/bin/env node

/**
 * IDS Enterprise Build Verification
 * When a build is finished, this script double-checks the output in the `/dist`
 * folder to ensure that all expected files are present.
 */

// -------------------------------------
// Requirements
// -------------------------------------
const chalk = require('chalk');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const slash = require('slash');

// Argv
const commandLineArgs = require('yargs')
  .usage('Usage: $node ./scripts/verify.js [-v] [-r]')
  .option('verbose', {
    alias: 'v',
    describe: 'Adds additional logging for more information',
    default: false
  })
  .option('rebuild', {
    alias: 'r',
    describe: 'Rebuilds the file list against a changed `/dist` folder',
    default: false
  })
  .help('h')
  .alias('h', 'help')
  .argv;

// Locals
const createDirs = require('./build/create-dirs');
const logger = require('./logger');
const writeFile = require('./build/write-file');

// Lists
const rootPath = slash(process.cwd());
const paths = {
  dist: `${rootPath}/dist`
};
const globOptions = {
  ignore: `${paths.dist}/tmp/**/*`
};

const foundFiles = [];
const foundFolders = [];

// -------------------------------------
// Functions
// -------------------------------------
function isDirectory(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.isDirectory();
  } catch (err) {
    logger('error', err);
    return false;
  }
}

// -------------------------------------
// Main
// -------------------------------------

logger('info', 'Verifying the last build...');

// Load expected files list.
// If the file doesn't exist, this script can't continue.
const expectedFilesListPath = path.join(process.cwd(), 'scripts', 'data', 'expected-files.json');
let expectedFiles;
try {
  expectedFiles = JSON.parse(fs.readFileSync(expectedFilesListPath, 'utf8'));
} catch (err) {
  if (!commandLineArgs.rebuild) {
    logger('error', `No files list available at "${expectedFilesListPath}".`);
    logger('error', 'Please re-run this script with "-r" flag to generate agaist the current distributable.');
    process.exit(1);
  }

  logger('alert', `No files list available at "${expectedFilesListPath}".`);
}

// Do a file glob against `/dist`.
glob(`${paths.dist}/**/*`, globOptions, (err, files) => {
  if (err) {
    logger('error', err);
    return;
  }

  // TODO:
  // - Count against a predetermined list
  // - Pass/Fail properly with Process Exit Codes
  files.forEach((file) => {
    const relativePath = slash(file).replace(rootPath, '');
    if (isDirectory(file)) {
      foundFolders.push(relativePath);
    } else {
      foundFiles.push(relativePath);
    }
  });

  // Log Folders
  logger('padded', `${chalk.cyan(`folders: ${chalk.bold(foundFolders.length)}`)}`);

  // Log Files
  logger('padded', `${chalk.cyan(`files: ${chalk.bold(foundFiles.length)}`)}`);
  if (commandLineArgs.verbose) {
    foundFiles.forEach((file) => {
      logger('padded', `${file}`);
    });
    logger('\n');
  }

  // Save a new list, if applicable
  if (commandLineArgs.rebuild) {
    // Write all files to a... file...
    const filesListTxt = JSON.stringify(foundFiles, null, '\t');

    // Create Dirs
    const outputPath = path.join(process.cwd(), 'data', 'expected-files.json');
    createDirs([
      path.join(process.cwd(), 'dist'),
      path.join(process.cwd(), 'dist', 'tmp')
    ]);

    // Save new file
    writeFile(outputPath, filesListTxt).then(() => {
      logger('beer', `New file list saved to "${chalk.yellow(outputPath)}"`);
      process.exit(0);
    });
  }

  // Get the differnce
  const missingFiles = expectedFiles.filter(x => !foundFiles.includes(x));

  // If files are missing, print and exit.
  if (missingFiles.length) {
    logger('error', `${chalk.red.bold(`(${missingFiles.length})`)} expected files are missing from the last build:`);
    missingFiles.forEach((file) => {
      logger('padded', `${chalk.red(file)}`);
    });
    process.exit(1);
  }

  logger('beer', `All ${chalk.green.bold(`(${expectedFiles.length})`)} expected files have been found!`);
  process.exit(0);
});
