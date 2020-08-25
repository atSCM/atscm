# Updating atscm

> You can use atscm to update atscm 😀

## Installing new versions

Simply run `atscm update` to install the latest version available. Add the `--beta` flag to install prerelease versions. Ensure to **backup your project** before doing so.

> Internally, we use [npm](https://www.npmjs.com) to install updates, which means that you can also run `npm install --save-dev atscm` instead.

## Updating your atscm project

We'll do our best to follow [semantic versioning](https://semver.org), which means you shouldn't need to update your project sources between non-major releases, e.g. when updating from _1.0.0_ to _1.0.1_ or _1.1.0_.

Between major releases (e.g. from 0.7.0 to 1.0.0) we introduce changes that may break your existing project. **Follow these steps to migrate your project to a new major version of atscm:**

- Backup your project _before_, e.g. with git: `git add . && git commit -m "chore: Backup before atscm update"`
- Start a fresh atvise server instance and push your current project: `atscm push`
- Update atscm: `atscm update`
- Pull your project sources from atvise server: `atscm pull --clean`
- Afterwards, you can commit commit the changes: `git add . && git commit -m "chore: Update atscm"`
