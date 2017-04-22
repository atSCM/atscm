# Contributing

We would love for you to contribute to atSCM. As a contributor, here are the guidelines we would like you to follow:

## Found a bug?

If you find a bug in the source code, you can help us by submitting an issue to this repository. Even better, you can submit a Pull Request with a fix.

## Missing a feature?

You can *request* a new feature by submitting an issue to this repository. If you would like to *implement* a new feature, please submit an issue with a proposal for your work first, to be sure that we can use it.

## Submission Guidelines

### Submitting an issue

Before you submit an issue, please search the issue tracker, maybe an issue for your problem already exists and the discussion might inform you of workarounds readily available.

We can only fix an issue if we can reproduce it. To help us provide the following information in your issue description:
 
 - **The original error message:** Any console output regarding the issue. Consider running *atscm* with verbose logging (using the command line option `-LLLL`) to get more error details.
 - ***atscm* and *atscm-cli* versions used:** The results of `atscm --version`.
 - **atvise server version used**
 - ***node* and *npm* versions used:** The results of `node --version` and `npm version`.
 - **Special project setup:** Any default overrides to your `Atviseproject.js` file, such as custom Transformers.

### Submitting a Pull Request (PR)

Before you submit your Pull Request (PR) consider the following guidelines:

 - Search GitHub for an open or closed PR that relates to your submission. You don't want to duplicate effort.
 - Make your changes in a new git branch: Run `git checkout -b my-fix-branch master`
 - Create your patch, **including appropriate test cases**.
 - Run the full test suite and ensure all tests pass.
 - Commit your changes using a descriptive commit message that follows our commit message conventions. Adherence to these conventions is necessary because release notes are automatically generated from these messages.
 - Push your branch to GitHub and create a pull request.
 
## Code quality control

> All files inside this project are automatically built, linted and tested by [CircleCI](https://circleci.com/gh/atSCM/atscm).

Builds will only pass if they meet the following criteria:

 - **No ESLint errors:** We use [ESLint](http://eslint.org) to lint our entire JavaScript code. The config used is [eslint-config-lsage](https://www.npmjs.com/package/eslint-config-lsage). Any lint errors will cause the build to fail. 
 - **Test coverage >= 90%:** We use [istanbul](https://gotwarlost.github.io/istanbul/) to validate test coverage is at least 90 percent. Any commits not covered by tests will cause the build to fail.
 - **Documentation coverage >= 90%:** Our source code is documented using [ESDoc](https://esdoc.org). We will only merge if your contribution is documented as well.

## Setting up the development environment

> In order to meet out coding guideline it's very useful to have your development environment set up right.

### Linting files

You can lint all source files by running `npm run lint`. Although most IDEs support running it directly in the editor:

**Jetbrains Webstorm**

[Webstorm](https://www.jetbrains.com/webstorm/) has built-in support for ESLint. Check out [their documentation](https://www.jetbrains.com/help/webstorm/2016.3/eslint.html) to set it up.

**Atom**

[Atom](https://atom.io) has several packages that provide support for inline ESLint validation. We recommend you to use [linter-eslint](https://atom.io/packages/linter-eslint).

### Running tests

Our [mocha](https://mochajs.org) tests can be run by calling `npm test`. If you want the tests to be run right after you saved your changes, then run `npm run test:watch`.

**Setup needed to run tests on atvise server**

Please note, that you have to **provide a valid atvise server connection** in order to get tests against atvise server running. You can achieve that by doing one of the following:

 - Set environment variables `ATVISE_USERNAME` and `ATVISE_PASSWORD` to valid credentials for the public atvise demo server at [demo.ativse.com](http://185.67.228.66:8888).
 - Adapt host, ports and login credentials inside `./test/fixtures/Atviseproject.babel.js`.

**Check test coverage**

Test coverage can be checked by running `npm run test:coverage`.

### Creating API documentation

Run `npm run docs` to create [ESDoc](https://esdoc.org) API documentation.

<!-- TODO: Add steps for creating good issues -->
<!-- TODO: Add links to documentation and manuals -->

## Commit Message Guideline

We have very precise rules over how our git commit messages can be formatted. This leads to more readable messages that are easy to follow when looking through the project history. But also, we use the git commit messages to **generate the changelog**.

### Commit message format

> tl;dr: We use an adaption of the [angular commit message convention](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines) with the only difference that capitalized subjects are allowed.

Each commit message consists of a *header*, a *body* and a footer. The header has a special format that includes a *type*, a *scope* and a *subject*:

```
<type>(<scope>): <subject>

<body>

<footer>
```

The *header* is mandatory and the *scope* of the *header* is optional. It cannot be longer than **72 characters**.

**Samples**

- Describe a documentation change

  `docs(changelog): Update changelog for version 1.2.3` 

- Describes a bug fix affecting mapping
  ```
  fix(mapping): Replace invalid data type for html help documents

  Prevents html help documents to have an invalid extension unter atvise server v3.1.0.
  
  Closes #123
  ```
  
#### Type

Must be one of the following:

 - **build:** Changes that affect the build system or external dependencies (example scopes: babel, npm)
 - **chore:** Maintainance tasks (example tasks: release)
 - **ci:** Changes to our CI configuration files and scripts (example scopes: circleci, appveyor, codecov)
 - **docs:** Documentation only changes
 - **feat:** A new feature
 - **fix:** A bug fix
 - **perf:** A code change that improves performance
 - **refactor:** A code change that neither fixes a bug nor adds a feature
 - **revert:** Reverts a previous commit.
 - **style:** Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
 - **test:** Adding missing tests or correcting existing tests

#### Scope

The scope should describe the feature affected. Must be lower case.

#### Subject

The subject contains succinct description of the change:

 - Use the imperative, present tense: "change" not "changed" nor "changes"
 - Capitalize first letter *(The only notable difference to the [angular commit message convention](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines))*
 - no dot (.) at the end
 
#### Body

Just as in the subject, use the imperative, present tense: "change" not "changed" nor "changes". The body should include the motivation for the change and contrast this with previous behavior.

#### Footer

The footer should contain any information about **Breaking Changes** and is also the place to reference GitHub issues that this commit **Closes**.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines. The rest of the commit message is then used for this.

### Commit message linting

The project is setup to use a **git hook that lints commit messages** before creating a commit. Do not bypass this hook.
 
See [husky's documentation on git GUI support](https://github.com/typicode/husky#git-gui-clients-support).
