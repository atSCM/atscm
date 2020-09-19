# Tutorial: Custom Transformer

> tl;dr: Jump to the [tutorial-custom-transformer repository](https://github.com/atSCM/tutorial-custom-transformer) to see the results.

In this document we'll guide you through the steps necessary to implement a custom Transformer.
Our transformer will use [Babel](http://babeljs.io) to transpile ES2015/ES6 JavaScript to plain ES5 JavaScript that works in all Browsers.

## Overview

Custom transformers provide an easy way to extend the build functionality of _atscm_. Basically, a transformer implements two behaviours: How atvise server nodes are mapped to files (when running `atscm pull`) and vice versa (when running `atscm push`).

**Where to store transformers**

Basically, transformers can be stored anywhere inside your _atscm_ project. When using a non-ES5 configuration language (such as ES2015 or TypeScript, chosen when running `atscm init`) transformers should also be written in this language. _atscm_ will handle the transpilation of your transformer code automatically. If you plan to write multiple custom transformers for your project, it is recommended to create your transformers in an own directory, e.g `./atscm`.

## Step 0: Project setup

In order to have the same starting point, create a new _atscm_ project to follow this tutorial. Run `atscm init` and **pick ES2015 as configuration language**.

As for now the atvise library is written in old ES5 JavaScript, we'll ignore it in our project. Adjust your project configuration accordingly:

```javascript
// Atviseproject.babel.js

...

export default class MyProject extends Atviseproject {
  ...

  static get ignoreNodes() {
    return super.ignoreNodes
      .concat(['ns=1;s=SYSTEM.LIBRARY.ATVISE']);
  }

}
```

Now we're ready to pull the project by running:

```
atscm pull
```

We'll use the default project files for testing later.

As suggested above, we'll store our custom transformer inside a new directory, `./atscm`. Create the directory and an empty file called _BabelTransformer.js_:

```bash
mkdir atscm
touch atscm/BabelTransformer.js
```

By now you should have a project containing an `./Atviseproject.babel.js` and an empty `./atscm/BabelTransformer.js` file.
Make sure the `./src` directory contains at least the _default Main display_ which should exist inside `./src/AGENT/DISPLAYS/Main.display`.

## Step 1: Import _PartialTransformer_ class

As we don't want to implement things twice we'll subclass _atscm_'s [Transformer class](https://atscm.github.io/atscm/class/src/lib/transform/Transformer.js~Transformer.html). As our transformer shall only be used for JavaScript source files we can even use the [PartialTransformer class](https://atscm.github.io/atscm/class/src/lib/transform/PartialTransformer.js~PartialTransformer.html) which supports filtering source files out of the box. As both of these classes are exported from _atscm_'s main file, importing them is pretty straightforward. Inside the _BabelTransformer.js_ file add:

```javascript
// atscm/BabelTransformer.js

import { PartialTransformer } from 'atscm';
```

## Step 2: Create the _BabelTransformer_ class

The next step is to create and export our Transformer class:

```javascript
// atscm/BabelTransformer.js

import { PartialTransformer } from 'atscm';

export default class BabelTransformer extends PartialTransformer {}
```

We just created a _PartialTransformer_ subclass that is exported as the file's default export. For more detailed information on ES2015's module system [take a look at the docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export).

## Step 3: Use _BabelTransformer_

By default, _atscm_ uses just some standard transformers. Any additional transformers must be configured to use inside the project's _Atviseproject_ file.

First of all, we have to import our newly created _BabelTransformer_ class:

```javascript
// Atviseproject.babel.js

import { Atviseproject } from 'atscm'
import BabelTransformer from './atscm/BabelTransformer';

export default class MyProject extends Atviseproject { ... }
```

Now we override the _Atviseproject.useTransformers_ [getter](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Functions/get) to use our transformer:

```javascript
// Atviseproject.babel.js

...

export default class MyProject extends Atviseproject {
  ...

  static get useTransformers() {
    return super.useTransformers
      .concat(new BabelTransformer());
  }

}
```

This statement tells _atscm_ to use a new _BabelTransformer_ instance **in addition to the default transformers** (`super.useTransformers`).

To verify everything worked so far run `atscm config`. Our new Transformer should show up in the _useTransformers_ section:

```
$ atscm config
[08:38:16] Configuration at ~/custom-transformer/Atviseproject.babel.js
{ host: '10.211.55.4',
  port:
   { opc: 4840,
     http: 80 },
  useTransformers:
   [ DisplayTransformer<>,
     ScriptTransformer<>,
     BabelTransformer<> ],
  ...
```

## Step 4: Implement _PartialTransformer#shouldBeTransformed_

[PartialTransformer#shouldBeTransformed](https://atscm.github.io/atscm/class/src/lib/transform/PartialTransformer.js~PartialTransformer.html#instance-method-shouldBeTransformed) is responsible for filtering the files we want to transform. Returning `true` means the piped file will be transformed, `false` bypasses the file.

In out case we want to edit all JavaScript source files. Therefore we return true for all files with the extension `.js`. Edit _BabelTransformer.js_ accordingly:

```javascript
// atscm/BabelTransformer

...

export default class BabelTransformer extends PartialTransformer {

  shouldBeTransformed(file) {
    return file.extname === '.js';
  }

}
```

## Step 5: Implement _Transformer#transformFromFilesystem_

Implementing [Transformer#transformFromFilesystem](https://atscm.github.io/atscm/class/src/lib/transform/Transformer.js~Transformer.html#instance-method-transformFromFilesystem) is probably the most important part of this tutorial. In here we define the logic that actually creates ES5 code from ES2015 sources.

First of all, we need to **install additional dependencies** required. Running

```bash
npm install --save-dev babel-core babel-preset-2015
```

will install [Babel](http://babeljs.io) and it's ES2015 preset. This preset ensures all ES5 compatible browsers will be able to run the resulting code.

We will also need the [node.js buffer module](https://nodejs.org/api/buffer.html). We don't need to install it, as it comes with every node installation.

Next, import these modules as usual:

```javascript
// atscm/BabelTransformer.js

import { Buffer } from 'buffer';
import { PartialTransformer } from 'atscm';
import { transform } from 'babel-core';

...
```

The import order follows a pretty usual convention:

1.  Core **node.js modules** (_buffer_ in our case)
2.  Other **external modules** (_babel-core_ and _atscm_ in our case)
3.  **Relative modules** (_./atscm/BabelTransformer.js_ inside _Atviseproject.babel.js_ in our case)

Now we're ready to implement _Transformer#transformFromFilesystem_. What we're about to do is pretty simple:

- We'll transpile the contents of the passed file with babels _transform_ method
- We clone the passed file and set it's contents to a Buffer containing the resulting code
- We pass the resulting file to other streams

```javascript
import ...

export default class BabelTransformer extends PartialTransformer {

  static shouldBeTransformed(file) { ... }

  transformFromFilesystem(file, enc, callback) {
    // Create ES5 code
    const { code } = transform(file.contents, {
      presets: ['es2015']
    });

    // Create new file with ES5 content
    const result = file.clone();
    result.contents = Buffer.from(code);

    // We're done, pass the new file to other streams
    callback(null, result);
  }

}
```

**Wow!** You just implemented your first custom transformer! Now we can write any scripts using the new ES2015 syntax.

## Step 6: Test _BabelTransformer_

It's time to check if everything works as expected. Create a script file for the Main display containing ES2015 JavaScript:

```javascript
// src/AGENT/DISPLAYS/Main.display/Main.js

// Class syntax
class Test {
  constructor(options = {}, ...otherArgs) {
    // Default values and rest params
    this.options = options;
    this.args = otherArgs.map((arg) => parseInt(arg, 10)); // Arrows and Lexical This
  }
}

const a = 13; // Constants
const { options, args } = new Test({ a }, '23'); // Enhanced Object Literals

alert(`Option a: ${options.a}, args: ${args.join(', ')}`); // Template Strings
```

Run `atscm push` to upload the new display script to atvise server. Open your atvise project in your favorite browser (you may have to delete the browser cache) and if everything worked you should see an alert box containing the text "Option a: 13, args: 23". When you inspect the page's source you'll see the display script code was transpiled to ES5.

## Step 7: Implement _Transformer#transformFromDB_

As said at the beginning, atscm transformers allow transformation from and to the filesystem. A babel transpilation is a one-way process, meaning you cannot create ES2015 source code from the resulting ES5 code. Therefore the only thing we can do when transforming from atvise server to the filesystem is to prevent an override.

We do so by implementing [Transformer#transformFromDB](https://atscm.github.io/atscm/class/src/lib/transform/Transformer.js~Transformer.html#instance-method-transformFromDB):

```javascript
// atscm/BabelTransformer.js
...

export default class BabelTransformer extends PartialTransfromer {
  ...

  transformFromDB(file, enc, callback) {
    // Optionally, we could print a warning here
    callback(null); // Ignore file, remove it from the stream
  }
}
```

Now we can run `atscm push` without overriding our ES2015 source code.

## Result

This is how your custom transformer should look now:

```javascript
// atscm/BabelTransformer.js

import { Buffer } from 'buffer';
import { PartialTransformer } from 'atscm';
import { transform } from 'babel-core';

export default class BabelTransformer extends PartialTransformer {
  shouldBeTransformed(file) {
    return file.extname === '.js';
  }

  transformFromFilesystem(file, enc, callback) {
    // Create ES5 code
    const { code } = transform(file.contents, {
      presets: ['es2015'],
    });

    // Create new file with ES5 content
    const result = file.clone();
    result.contents = Buffer.from(code);

    // We're done, pass the new file to other streams
    callback(null, result);
  }

  transformFromDB(file, enc, callback) {
    callback(null); // Ignore file, remove it from the stream
  }
}
```

## Conclusion

We just created a custom Transformer in no time. It transpiles ES2015 code on push and prevents overriding this code on pull.

Of course there are many ways to improve the transformer, for example:

- Handle options to configure how babel transpiles the source code

## Further reading

- [babeljs.io](http://babeljs.io/learn-es2015/) provides a nice overview of ES2015 features. You can also use the [REPL](http://babeljs.io/repl/) to try out these features.
