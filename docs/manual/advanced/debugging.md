# Guide: Debugging atscm

_atscm_ can be easily debugged using Google Chrome's developer tools. All you have to do to attach the debugger, is to start the command line interface with the `--inspect` or `--inspect-brk` flag. For this to work you must first find the path to _atscm-cli_'s executable:

```bash
which atscm
```

**Note: This only works on Linux and macOS only**

You can now use this executable directly and run it with the inspector flags, e.g.:

```bash
node --inspect-brk "$(which atscm)" [arguments passed to atscm]
```

[For further details on how to use the debugger, visit the offical nodejs docs on debugging.](https://nodejs.org/en/docs/guides/debugging-getting-started/)
