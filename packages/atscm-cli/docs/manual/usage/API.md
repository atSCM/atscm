# Programmatic usage

> Please note that using the _atscm-cli_ API is an advanced topic.
>
> **It's recommended to use the [command line interface](usage/CLI.html) whenever possible.**

## ES6 JavaScript

The code provided in this document is written in [ES2015 JavaScript](http://babeljs.io/learn-es2015/).

You will have to transpile it (e.g with [Babel](http://babeljs.io)) in order to get it running.

## Creating a Cli instance

Basically, the [AtSCMCli](../../class/src/AtSCMCli.js~AtSCMCli.html) class can be used just like any other class:

```javascript
import AtSCMCli from 'atscm-cli';

const cli = new AtSCMCli();
```

As stated in the [API reference](../../api/class/src/AtSCMCli.js~AtSCMCli.html#instance-constructor-constructor) the constructor takes any arguments the [command line interface](usage/CLI.html) can handle. E.g. running

```javascript
import AtSCMCli from 'atscm-cli';

const cli = new AtSCMCli(['--version']);
cli.launch();
```

will print the version, just as if we ran the _atscm-cli_ from the command line.

The main difference between API and command line usage is, that **exceptions are not handled**. You'll have to do that yourself:

```javascript
import AtSCMCli from 'atscm-cli';

new AtSCMCli(['--version'])
  .launch() // Note: AtSCMCli#launch returns a Promise
  .then(() => console.log('success!'))
  .catch((err) => console.error(`Oops! An error occured: ${err.message}`));
```

---

Please refer to [AtSCMCli's class reference](../../class/src/AtSCMCli.js~AtSCMCli.html) in order to see all methods and properties available.
