# atscm

> Source code management utilities for atvise

[![CircleCI](https://circleci.com/gh/atSCM/atscm.svg?style=shield)](https://circleci.com/gh/atSCM/workflows/atscm)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/d9e5vi6a7ygisjsr/branch/master?svg=true&pendingText=windows%20tests%20pending&passingText=windows%20tests%20passing&failingText=windows%20tests%20failing)](https://ci.appveyor.com/project/LukasHechenberger/atscm)
[![codecov](https://codecov.io/gh/atSCM/atscm/branch/master/graph/badge.svg)](https://codecov.io/gh/atSCM/atscm)
[![ESDoc](https://atscm.github.io/atscm/badge.svg)](https://atscm.github.io/atscm)

_atscm_ is a [node.js](https://nodejs.org) based utility that stores the contents of atvise projects on the file system. This has several benefits to advanced atvise developers:

- atvise project can be put under source control (e.g. using _git_)
- source code can be edited in external editors
- easier unit testing
- easier source code linting / static analysis
- source files can be preprocessed by using custom transformers: <!-- TODO: Insert links -->
  - using alternate programming languages such as [ES2015 JavaScript](http://babeljs.io/learn-es2015/) or [TypeScript](http://www.typescriptlang.org)
  - using alternate markup languages such as [pug](https://pugjs.org)
  - using templating engines such as [handlebars](http://handlebarsjs.com)

## Installation

This module can be installed via [atscm-cli](https://github.com/atSCM/atscm-cli).

<details>
<summary><strong>Installing <i>atscm-cli</i></strong></summary>

- Make sure [node.js](https://nodejs.org) (version 8 or later) is installed by running `node --version`.
- Make sure [npm](https://www.npmjs.com) is installed by running `npm --version`.
- Run `npm install --global atscm-cli` to install _atscm-cli_ globally. _You may have to run this command as an administrator._

</details>

With [atscm-cli](https://github.com/atSCM/atscm-cli) installed run `atscm init` to create a new _atscm_ project.

## Basic usage

**Pulling nodes from atvise server**

Running `atscm pull` will download all nodes from atvise server into the `./src` folder inside your project.

By default only displays, serverside scripts and quickdynamics will be split into their JavaScript and SVG sources. You can specify additional transformers to use in your [Project configuration](#project-configuration) file.

**Pushing source files to atvise server**

Running `atscm push` will update all nodes from the contents of your `./src` folder.

**Automatically watching for changes**

After running `atscm watch` files and atvise server nodes are watched for changes. If a file changes, the file is pushed, if a node changes this node is pulled.

`atscm watch` is very useful if you want edit source files in an external editor but still have the ability to use _atvise builder_'s drag and drop functionality.

## Project configuration

An atscm project's configuration is stored inside the _Atviseproject_ file inside your project root. See the [Atviseproject class reference](https://atscm.github.io/atscm/class/src/lib/config/Atviseproject.js~Atviseproject.html) for available options.
