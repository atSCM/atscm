# atscm

[![CircleCI](https://circleci.com/gh/atSCM/atscm/tree/master.svg?style=svg)](https://circleci.com/gh/atSCM/atscm)

_atscm_ is a node.js-based utility that stores the contents for atvise projects on the file system. This allows you to use your favorite IDE and development tools.

For more details visit our docs at [atscm.github.io](https://atscm.github.io). With _atscm-cli_ installed, you can run `atscm docs` to do so 😀.

## Overview

<!-- BEGIN overview -->
<!-- This section is generated. Run `npm run update-monorepo` to update it. -->

### Installation

_atscm_ can be installed via [atscm-cli](https://github.com/atSCM/atscm-cli).

<details>
<summary><strong>Installing <i>atscm-cli</i></strong></summary>

- Make sure [node.js](https://nodejs.org) (version 10 or later) is installed by running `node --version`.
- Make sure [npm](https://www.npmjs.com) is installed by running `npm --version`.
- Run `npm install --global atscm-cli` to install _atscm-cli_ globally. _You may have to run this command as an administrator._

</details>

With [atscm-cli](https://github.com/atSCM/atscm-cli) installed run `atscm init` to create a new _atscm_ project.

### Basic usage

**Pulling nodes from atvise server**

Running `atscm pull` will download all nodes from atvise server into the `./src` folder inside your project.

By default only displays, serverside scripts and quickdynamics will be split into their JavaScript and SVG sources. You can specify additional transformers to use in your [Project configuration](#project-configuration) file.

**Pushing source files to atvise server**

Running `atscm push` will update all nodes from the contents of your `./src` folder.

**Automatically watching for changes**

After running `atscm watch` files and atvise server nodes are watched for changes. If a file changes, the file is pushed, if a node changes this node is pulled.

`atscm watch` is very useful if you want edit source files in an external editor but still have the ability to use _atvise builder_'s drag and drop functionality.

<!-- END overview -->

## Packages

> _Note: We switched to a monorepo after version 1.1. This is an ongoing process, expect more packages to appear here soon._

This repository is structured as a [pnpm workspace](https://pnpm.js.org/en/workspaces) holding these packages:

<!-- BEGIN packages -->
<!-- This section is generated. Run `npm run update-monorepo` to update it. -->

- [atscm](./packages/atscm) Source code management utilities for atvise

  > ![npm](https://img.shields.io/npm/v/atscm?logo=npm)
  >
  > [GitHub](https://github.com/atSCM/atscm/tree/master/packages/atscm#readme) · [npm](https://www.npmjs.com/package/atscm)
- [create-atscm](./packages/create-atscm) Create a new atscm project with `npm init`

  > ![npm](https://img.shields.io/npm/v/create-atscm?logo=npm)
  >
  > [GitHub](https://github.com/atSCM/atscm/tree/master/packages/create-atscm#readme) · [npm](https://www.npmjs.com/package/create-atscm)

<!-- END packages -->
