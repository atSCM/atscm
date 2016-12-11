const joinPath = require('path').join;
const esdocConfig = require('../esdoc.json');

// Get ESDoc-generated coverage.json
const docsCoveragePath = joinPath('../', esdocConfig.destination, 'coverage.json');
const docsCoverage = require(docsCoveragePath);

// Configuration
const requiredPercentage = 90;

// Get docs coverage
const givenPercentage = parseInt(/([0-9]+)%/.exec(docsCoverage.coverage)[1], 10);

// Report docs coverage
const msg = `Documentation coverage is at ${docsCoverage.coverage}`;
if (givenPercentage >= requiredPercentage) {
  process.stdout.write(`${msg}.\r\n`);
} else {
  process.stderr.write(`${msg}, ${requiredPercentage}% required.\r\n`);
  process.exit(1);
}
