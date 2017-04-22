# atscm

> Source code management utilities for atvise

[![CircleCI](https://circleci.com/gh/atSCM/atscm.svg?style=shield)](https://circleci.com/gh/atSCM/atscm)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/d9e5vi6a7ygisjsr?svg=true&pendingText=windows%20tests%20pending&passingText=windows%20tests%20passing&failingText=windows%20tests%20failing)](https://ci.appveyor.com/project/LukasHechenberger/atscm)
[![codecov](https://codecov.io/gh/atSCM/atscm/branch/master/graph/badge.svg)](https://codecov.io/gh/atSCM/atscm)
[![ESDoc](https://doc.esdoc.org/github.com/atSCM/atscm/badge.svg)](https://doc.esdoc.org/github.com/atSCM/atscm/)

## Installation

This module can be installed via [atscm-cli](https://github.com/atSCM/atscm-cli).

<details>
<summary><strong>Installing <i>atscm-cli</i></strong></summary>

 - Make sure node.js (version 6 or later) is installed by running `node --version`.
 - Make sure npm is installed by running `npm --version`.
 - Run `npm install --global atscm-cli` to install *atscm-cli* globally. *You may have to run this command as an administrator.*

</details>

With [atscm-cli](https://github.com/atSCM/atscm-cli) installed run `atscm init` to create a new *atscm* project.

## Basic usage

**Pulling nodes from atvise server**

Running `atscm pull` will download all nodes from atvise server into the `./src` folder inside your project.

By default only displays, serverside scripts and quickdynamics will be split into their JavaScript and SVG sources. You can specify additional transformers to use in your [Project configuration](#project-configuration) file.

**Pushing source files to atvise server**

Running `atscm push` will update all nodes from the contents of your `./src` folder.

**Automatically watching for changes**

After running `atscm watch` files and atvise server nodes are watched for changes. If a file changes, the file is pushed, if a node changes this node is pulled.

`atscm watch` is very useful if you want edit source files in an external editor but still have the ability to use *atvise builder*'s drag and drop functionality.

## Project configuration

An atscm project's configuration is stored inside the *Atviseproject* file inside your project root. See the [Atviseproject class reference](https://doc.esdoc.org/github.com/atSCM/atscm/class/src/lib/config/Atviseproject.js~Atviseproject.html) for available options.
