# Contribute: Testing atscm

atscm uses both unit and integration tests. [Mocha](https://mochajs.org) is used as a test runner and [nyc](https://github.com/istanbuljs/nyc#readme) for test coverage reports.

**Test scripts:**

| Command                    | Description                        |
| :------------------------- | :--------------------------------- |
| `npm run test`             | Run all tests                      |
| `npm run test:unit`        | Run all unit tests                 |
| `npm run test:integration` | Run all integration tests          |
| `npm run test:watch`       | Re-run all tests when files change |
| `npm run test:coverage`    | Check test coverage                |

## Unit tests

The unit tests are located inside `./test/src`. Test files are named after the module they test, e.g. unit tests for `./src/my/module.js` are inside `./test/src/my/module.spec.js`.

## Integration tests

Integration tests are used to ensure cross-version and -platform compatibility. They are located inside `./test/integration`.

### Test setups

For most integration tests, we use test setups to create the proper project structure to test against. These are XML files that can be imported to the running atserver before the tests are run. **The easiest way to create such files is with atbuilder:**

- First _connect atvise builder_ to your running atserver
- Create and _configure the node(s)_ you want to test against
- Select theses nodes, right-click them and choose _"Export hierarchy to XML"_ from the context menu.
- Save the export file to `./test/fixtures/setup`.

After this, you can use the _importSetup_ method exported from [`./test/helpers/atscm.js`](./test/helpers/atscm.js) to import this setup. See the existing integration tests for examples.
