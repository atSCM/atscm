# atscm-cli

> [atSCM](https://github.com/atSCM/atscm) command line interface

[![CircleCI](https://circleci.com/gh/atSCM/atscm-cli.svg?style=shield)](https://circleci.com/gh/atSCM/atscm-cli)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/m7dy3spqfg4b2d9f?svg=true&pendingText=windows%20tests%20pending&passingText=windows%20tests%20passing&failingText=windows%20tests%20failing)](https://ci.appveyor.com/project/LukasHechenberger/atscm-cli)
[![codecov](https://codecov.io/gh/atSCM/atscm-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/atSCM/atscm-cli)
[![ESDoc](https://atscm.github.io/atscm-cli/badge.svg)](https://atscm.github.io/atscm-cli)

## Installation

This module can be installed via [npm](https://www.npmjs.com). With [node.js](https://nodejs.org/en/) **version 8 or later** installed run:

```bash
# Install atscm-cli globally
npm install -g atscm-cli
```

_You may have to run this command as an administrator._

## Basic usage

> You can find more detailed usage information in the [usage manuals](https://atscm.github.io/atscm-cli/manual/CLI.html).

### Creating a new _atSCM_ project

Running `atscm init` will prompt you for a project name, description, etc. and create a new _atSCM_ project.

For more detailed information on the init command look at the [manuals](https://atscm.github.io/atscm-cli/manual/index.html).

### Running tasks

Run tasks by typing `atscm [task]` inside a project directory.

Lookup the tasks available in [the atscm manuals](https://atscm.github.io/atscm/manual/index.html) or by running `atscm --tasks`.

### Open documentation

Running `atscm docs` will open the API documentation of the _atscm_ module, running `atscm docs --cli` will open the documentation of this module.
