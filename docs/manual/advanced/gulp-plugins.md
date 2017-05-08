# Guide: gulp.js plugins

> **Please note:** This guide assumes you have a basic knowledge on how gulp.js and custom *atscm* transformers work. You may go through [gulp's getting started guide](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) or the [custom transformer tutorial](https://doc.esdoc.org/github.com/atSCM/atscm/manual/tutorial/custom-transformer.html) first otherwise.   

*atscm* heavily relies on the [gulp.js](http://gulpjs.com) build tool. Therefore it's pretty easy to integrate existing [gulp plugins](http://gulpjs.com/plugins/) into *atscm* transformers.

## Using *Transformer* class

Basically, the only Transformer method you have to override is [Transformer#applyToStream](https://doc.esdoc.org/github.com/atSCM/atscm/class/src/lib/transform/Transformer.js~Transformer.html#instance-method-applyToStream). In there, you can pipe your gulp plugin just as you would do in a regular gulp project. The only difference is, that you have to handle the current transform direction as well:

**A basic example:**

```javascript
import { Transformer, TransformDirection } from 'atscm';
import fromDBGulpPlugin from 'gulp-plugin-to-use-from-db';
import fromFSGulpPlugin from 'gulp-plugin-to-use-from-fs';

class MyTransformer extends Transformer {

  applyToStream(stream, direction) {
    if (direction === TransformDirection.FromDB) {
      return stream.pipe(fromDBGulpPlugin(/* plugin options */));
    }

    return stream.pipe(fromFSGulpPlugin(/* plugin options */));
  }

}
```

## Using *PartialTransformer* class

In most cases you'll have to transform only parts of the piped files. This can be done by inheriting from [PartialTransfomer class](https://doc.esdoc.org/github.com/atSCM/atscm/class/src/lib/transform/PartialTransformer.js~PartialTransformer.html):

**Transforming only JavaScript files:**

```javascript
import { PartialTransformer, TransformDirection } from 'atscm';
import fromDBGulpPlugin from 'gulp-plugin-to-use-from-db';
import fromFSGulpPlugin from 'gulp-plugin-to-use-from-fs';

class MyPartialTransformer extends PartialTransformer {

  shouldBeTransformed(file) {
    return file.extname === '.js';
  }

  applyToFilteredStream(stream, direction) {
    if (direction === TransformDirection.FromDB) {
      return stream.pipe(fromDBGulpPlugin(/* plugin options */));
    }

    return stream.pipe(fromFSGulpPlugin(/* plugin options */));
  }

}
```

## Conclusion

Using existing gulp plugins is probably the easiest way to use custom transformers inside an *atscm* project. As there are **thousands of well-tested gulp-plugins** out there, you won't have to implemtent any transform logic in most cases.

Give it a try!

## Further reading

 - Take a look at [gulp's plugin page](http://gulpjs.com/plugins/) for a list of available plugins.
