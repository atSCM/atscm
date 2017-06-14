# Command line interface

> Please not that this module is **under heavy development**. Anything described in here may change in future versions.
> For an up-to-date list of commands and options run `atscm --help`.

## Commands

- **`run [tasks...]`** - Runs the specified tasks.
  
  If no command is specified when running *atscm*, this command will be used as the default, e.g. `atscm push` equals `atscm run push`. Running `atscm --tasks` will list all tasks available.
- **`init`** - Creates a new *atscm* project.
- **`config`** - Prints the current project's configuration.
- **`docs`** - Opens the *atscm* API documentation in a browser.
- **`update`** - Checks for *atscm* updates in the current project and installs a newer version if available. *(since atscm-cli version 0.3)*

## Options *(incomplete)*

> Options available vary on the command used. Run `atscm {command} --help` for a complete list of options.

- **`--help, -h`** - Prints usage information.
- **`--version, -v`** - Prints the current version.
- **`--log-level, -L`** - Sets the log level.

  There are multiple log levels available:
   
   - 0: Silent
   - 1: Error
   - 2: Warn
   - 3: Info (default)
   - 4: Debug

  Passing `-L` will only print errors, `-LLLL` will print debug information.

### How to pass options

Options can be passed as regular command line options, e.g. `atscm push --cwd ~/Docs` or `atscm push --cwd=~/Docs`, but they can also be passed as **environment variables**. To do so set environment variables with the uppercase name of the option, prefixed with `ATSCM_`, e.g. `ATSCM_CWD=~/Docs atscm push` on a Unix-based machine or by running `setx ATSCM_CWD "%USERPROFILE%\Test"` under Windows.
 
**Note:** Using environment variables to set options requires **atscm-cli version >= 0.3**.

### Overriding project configuration

The project configuration (the *Atviseproject* module of your project) can also be overridden at runtime.

**Passing overrides by using the `--project` option:**

You can pass overrides directly by setting the `--project` option, where the path to the value to override is delimited with dots (`.`). E.g. if you want to set the project's opc port to *1234*, pass `--project.port.opc 1234`.

**Passing overrides by setting `ATSCM_PROJECT` environment variables:**

Overrides can also be passed as environment variables, prefixed with `ATSCM_PROJECT__`, where key paths are delimited with a double underscore (`__`). To set the project's opc port as an example, set the environment variable `ATSCM_PROJECT__PORT__OPC` to `1234`.

**Note:** Project configuration overrides require **atscm-cli version >= 0.3** and **atscm version >= 0.4**.
