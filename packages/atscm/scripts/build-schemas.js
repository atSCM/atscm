/* eslint-disable global-require,import/no-commonjs */

const { promises: fsp } = require('fs');
const { join, basename, relative } = require('path');
const { compile } = require('json-schema-to-typescript');
const camelcase = require('camelcase');
const parameterSchema = require('../schemas/parameter-config.json');

const configSchemas = ['display-config.json', 'serverscript-config.json'];
const log = console.log; // eslint-disable-line no-console
const writeJSON = (path, value) => fsp.writeFile(path, `${JSON.stringify(value, null, '  ')}\n`);

async function bundleSchemas() {
  for (const filename of configSchemas) {
    // Inline parameter schema
    const schemaPath = join(__dirname, '../schemas', filename);

    log(`Updating schema at '${relative(process.cwd(), schemaPath)}'`);

    const schema = require(schemaPath);
    schema.properties.parameters.items = {
      $comment: "NOTE: This is imported from './parameter-config.json'",
      ...parameterSchema,
      $schema: undefined,
    };

    await writeJSON(schemaPath, schema);

    // Create type definitions
    const schemaName = basename(schemaPath, '.json');
    const typeName = camelcase(schemaName, { pascalCase: true });
    const dtsPath = join(__dirname, '../types/schemas/', `${schemaName}.d.ts`);

    log(`Updating type definitions at '${relative(process.cwd(), dtsPath)}'`);

    const compiled = await compile(schema, typeName, { format: false });
    await fsp.writeFile(dtsPath, compiled);
  }

  log('Done');
}

module.exports = bundleSchemas;
if (require.main === module) {
  bundleSchemas().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
