const joinPath = require('path').join;
const { writeFileSync } = require('fs');
const args = require('yargs').argv;
const esdocConfig = require('../esdoc.json');

// Configuration
const RequiredPercentage = 90;

// Paths
const docsPath = joinPath('../', esdocConfig.destination);
const docsCoveragePath = joinPath(docsPath, 'coverage.json');
const docsReportPath = args._.length >= 0 ? args._[0] : undefined;

// Get ESDoc-generated coverage.json
const docsCoverage = require(docsCoveragePath);

// Get docs coverage
const givenPercentage = parseInt(/([0-9]+)%/.exec(docsCoverage.coverage)[1], 10);

// Report docs coverage
const fail = givenPercentage < RequiredPercentage;
const msg = `Coverage is at ${docsCoverage.coverage} (${RequiredPercentage}% required)`;

if (docsReportPath) { // Create JUnit XML Report
  const report = `<testsuite name="ESDoc coverage" tests="1">
  <testcase classname="ESDoc" name="Coverage">${
      fail ? `\n    <failure type="NotEnoughCoverage">${msg}</failure>\n` : ''
    }  </testcase>
</testsuite>`;

  writeFileSync(docsReportPath, report);
}

process.stdout.write(`${msg}\n`);

if (fail) {
  process.exit(1);
}
