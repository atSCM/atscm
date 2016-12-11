# Contributing

Contributions are welcome.

## Code quality control

> All files inside this project are automatically built, linted and tested by [CircleCI](https://circleci.com/gh/atSCM/atscm).

Builds will only pass if they meet the following criteria:

- **No ESLint errors:** We use [ESLint](http://eslint.org) to lint our entire JavaScript code. The config used is [eslint-config-lsage](https://www.npmjs.com/package/eslint-config-lsage). Any lint errors will cause the build to fail.
- **Test coverage >= 90%:** We use [istanbul](https://gotwarlost.github.io/istanbul/) to validate test coverage is at least 90 percent. Any commits not covered by tests will cause the build to fail.

Additionally pull requests will not be merged unless they meet these (manually validated) criteria:

- **Documentation coverage >= 90%:** Our source code is documented using [ESDoc](https://esdoc.org). We will only merge if your contribution is documented as well. 

## Setting up the development environment

> In order to meet out coding guideline it's very useful to have your development environment set up right.

### Linting files

You can lint all source files by running `npm run lint`. Although most IDEs support running it directly in the editor:

**Jetbeans Webstorm**

[Webstorm](https://www.jetbrains.com/webstorm/) has built-in support for ESLint. Check out [their documentation](https://www.jetbrains.com/help/webstorm/2016.3/eslint.html) to set it up.

**Atom**

[Atom](https://atom.io) has several packages that provide support for inline ESLint validation. We recommend you to use [linter-eslint](https://atom.io/packages/linter-eslint).

### Running tests

Our [mocha](https://mochajs.org) tests can be run by calling `npm test`. If you want the tests to be run right after you saved your changes, then run `npm run test:watch`.

Test coverage can be checked by running `npm run test:coverage`.

### Creating API documentation

Run `npm run docs` to create [ESDoc](https://esdoc.org) API documentation.

<!-- TODO: Add steps for creating good issues -->
<!-- TODO: Add links to documentation and manuals -->
