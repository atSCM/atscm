# Custom Transformers

Custom transformers allow you to use any kind of processing on your source files. This includes transpiling from and to different programming languages (e.g. [TypeScript](http://www.typescriptlang.org)).

## Transformer API

Basically a transformer is just an object that provides two [node.js transfrom streams](https://nodejs.org/api/stream.html#stream_class_stream_transform): One for transforming OPC-UA nodes from atvise server to files and one transforming files to OPC-UA nodes again.

Every transformer is a subclass of the [Transformer class](../class/src/lib/transform/Transformer.js~Transformer.html). Override [Transformer#fromDBStream](../class/src/lib/transform/Transformer.js~Transformer.html#instance-get-fromDBStream) and [Transformer#fromFilesystemStream](file:///Users/lukas/Documents/Bachmann/atscm/atscm/docs/api/class/src/lib/transform/Transformer.js~Transformer.html#instance-get-fromFilesystemStream) to add your own transforms.

**Basic example:**

```javascript
import { Transformer } from 'atscm';
import { createFromDBStream, createFromFsStream } from './somewhere';

class MyTransformer extends Transformer {
  
  ...
  
  get fromDBStream() {
    return createFromDBStream();
  }
  
  get fromFilesystemStream() {
    return createFromFsStream();
  }
  
  ...
  
}
```

In most cases you will apply your transformers to just some of the files processed, in which case you should subclass the [PartialTransformer class](file:///Users/lukas/Documents/Bachmann/atscm/atscm/docs/api/class/src/lib/transform/PartialTransformer.js~PartialTransformer.html).

**Example Transformer applied only to JavaScript source files:**

```javascript
import { PartialTransformer } from 'atscm';

class MyJsTransformer extends PartialTransformer {
  
  ...
  
  // Only transform files ending with `.js`
  shouldBeTransformed(file) {
    return file.extname === '.js';
  }
  
  get fromDBStream() { ... }
  
  get fromFilesystemStream() { ... }
  
}
```

## Using own transformers

Any transformers used must be referenced in your  *Atviseproject*-file's useTransformer section.

**Using a custom transformer:**

```javascript
/* File: ./atscm/MyTransformer.js */
import { Transformer } from 'atscm';

export default class MyTransformer extends Transformer { ... }

/* File: ./Atviseproject.babel.js */
import { Atviseproject } from 'atscm';
import MyTransformer from './atscm/MyTransformer';

export default class MyProject extends Atviseproject {
  
  ...
  
  static get useTransformers() {
    return super.useTransformers.concat(new MyTransformer())
  }
  
}
```

## Wrapping a gulp plugin

In most cases [gulp.js](http://gulpjs.com) plugin export a function that returns a transform stream. Therefore most gulp plugins can be used just as in the above examples:

```javascript
import gulpPlugin from 'gulp-plugin';
import { Transformer } from 'atscm';

class MyTransformer extends Transformer {
  
  ...
  
  get fromFilesystemStream() {
    // Assuming that `gulpPlugin` returns a stream like most gulp plugins
    return gulpPlugin(/* options */)
  }
  
  ...
  
}
```

See [the gulp plugin page](http://gulpjs.com/plugins/) for a list of gulp plugins.

