# atscm-cli

> [atSCM](https://github.com/atSCM/atscm) command line interface

[![CircleCI](https://circleci.com/gh/atSCM/atscm-cli.svg?style=shield)](https://circleci.com/gh/atSCM/atscm-cli)
[![codecov](https://codecov.io/gh/atSCM/atscm-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/atSCM/atscm-cli)
[![ESDoc](https://doc.esdoc.org/github.com/atSCM/atscm-cli/badge.svg)](https://doc.esdoc.org/github.com/atSCM/atscm-cli)

## Installation

<!-- TODO: Update once published -->
As this modules is **not yet published** it requires manual building and linking:

```bash
# Clone the Repository
git clone https://github.com/atSCM/atscm-cli.git

# Enter the repository
cd atscm-cli

# Install dependencies
npm install

# Install atscm-cli globally
npm install -g .
```

*You may have to run the last command as an administrator.*

## Basic usage

> You can find more detailed usage information in the [usage manuals](https://doc.esdoc.org/github.com/atSCM/atscm-cli/manual/usage/CLI.html).

### Creating a new *atSCM* project

Running `atscm init` will prompt you for a project name, description, etc. and create a new *atSCM* project.

For more detailed information on the init command look at the [manuals](https://doc.esdoc.org/github.com/atSCM/atscm-cli/manual/index.html).

### Running tasks

Run tasks by typing `atscm [task]` inside a project directory.

Lookup the tasks available in [the atscm manuals](https://doc.esdoc.org/github.com/atSCM/atscm/manual/index.html).

### Open documentation

Running `atscm docs` will open the API documentation of the *atscm* module, running `atscm docs --cli` will open the documentation of this module.
