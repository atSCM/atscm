# Guide: Using the API

> Learn how to use the atscm API to e.g. run server serverscripts in your node application.
> **The atscm API is currently in beta.**

## Installation

First of all, make sure your project has atscm installed: Take a look at your _package.json_ file and make sure, atscm is present in the _dependencies_ or (depending on your use case) _devDependencies_ section. Otherwise, **install atscm if necessary**:

```bash
# If you need atscm as a runtime-dependency
npm install --save atscm@beta

# If you need atscm as a development dependency
npm install --save-dev atscm@beta
```

<!-- FIXME: Remove once 1.0.0 is realease -->

> Once atscm v1.0.0 is released, you can omit the `@beta`.

## Configuration

Similar to regular atscm projects, you need an _Atviseproject_ file that contains atscm's configuration. A minimal example may look like this:

```js
// Atviseproject.js
const { Atviseproject } = require('atscm');

module.exports = class ApiProject extends Atviseproject {
  // Add your configuration here, if needed.
  // By default, atvise server is assumed to run on opc.tcp://localhost:4840
};
```

Before you can finally require the atscm API in your project, you have to **set the `ATSCM_CONFIG_PATH` environment variable**, pointing to your _Atviseproject_ file. You can do this in multiple ways:

- You can set it in your app at runtime (_recommended_)

  Adjust your app's entry file (assuming it's called _app.js_ in these examples) to set the variable **before you import atscm**:

  ```js
  // app.js
  const { join } = require('path');

  process.env.ATSCM_CONFIG_PATH = join(__dirname, '../Atviseproject.js');

  // Your app comes here...
  ```

- You can set it every time you run your application:

  E.g. instead of running your app with `node ./app.js` you can use `ATSCM_CONFIG_PATH="/my-project/Atviseproject.js" node ./app.js`.

  You can also use npm scripts so you simply have to run `npm run start`:

  ```json
  // package.json
  {
    "scripts": {
      "start": "ATSCM_CONFIG_PATH='/my-project/Atviseproject.js' node ./app.js"
    }
  }
  ```

  If your running on windows, use [`cross-env`](https://www.npmjs.com/package/cross-env) to set the environment variable (don't forget `npm install cross-env`):

  ```json
  // package.json
  {
    "scripts": {
      "start": "cross-env ATSCM_CONFIG_PATH='/my-project/Atviseproject.js' node ./app.js"
    }
  }
  ```

## Usage

Require `atscm/api` and call the methods you need:

```js
// Set process.env.ATSCM_CONFIG_PATH here...

const atscm = require('atscm/api');

// You can use atscm here...
```

## Examples

**Create an export file for a node**

```js
// app.js

// Import node core modules
const { promises: fsp } = require('fs');
const { join, dirname } = require('path');

// Set atscm config env variable
process.env.ATSCM_CONFIG_PATH = join(__dirname, './Atviseproject.js');

// Require atscm and node-opcua APIs
const { NodeId } = require('atscm');
const { callMethod } = require('atscm/api');
const { Variant, DataType, VariantArrayType } = require('node-opcua');

// Configuration: You could also use process.argv here...
const nodesToExport = ['AGENT.DISPLAYS.Main'];
const exportPath = './out/export.xml';

// Our main function
async function createExportFile() {
  console.log(`Exporting nodes: ${nodesToExport.join(',')}`);

  // Use the 'exportNodes' method to create an xml export on the server
  const {
    outputArguments: [{ value }],
  } = await callMethod(new NodeId('AGENT.OPCUA.METHODS.exportNodes'), [
    new Variant({
      dataType: DataType.NodeId,
      arrayType: VariantArrayType.Array,
      value: nodesToExport.map(id => new NodeId(id)),
    }),
  ]);

  // Create the output directory if needed
  await fsp.mkdir(dirname(exportPath), { recursive: true });

  // Write the export to the file
  await fsp.writeFile(exportPath, value);

  console.log(`Export written to ${exportPath}`);
}

// Run it and catch any errors
createExportFile().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

> Note: The example assumes the Atviseproject file is located in the same directory as the app's entry file. Otherwise you have to adjust you code accordingly.
