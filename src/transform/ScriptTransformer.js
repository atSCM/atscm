import Logger from 'gulplog';
import XMLTransformer from '../lib/transform/XMLTransformer';

/**
 * A transformer that splits atvise scripts and quick dynamics into a code file and a .json file
 * containing parameters and metadata.
 */
export default class ScriptTransformer extends XMLTransformer {

  /**
   * Returns `true` for all files containing script code or quick dynamics.
   * @param {AtviseFile} file The file to check.
   * @return {Boolean} `true` for all files containing script code or quick dynamics.
   */
  shouldBeTransformed(file) {
    return file.isScript || file.isQuickDynamic;
  }

  /**
   * Splits any read files containing scripts or quick dynamics into their JavaScript sources,
   * alongside with a .json file containing parameters and metadata.
   * @param {AtviseFile} file The script file to split.
   * @param {String} enc The encoding used.
   * @param {function(err: Error, file: AtviseFile)} callback Called with the error that occured
   * while transforming the script, or the file passed through.
   */
  transformFromDB(file, enc, callback) {
    this.decodeContents(file, (err, results) => {
      if (err) {
        callback(err);
      } else {
        if (!results || results.script === undefined) {
          Logger.warn(`Empty document at ${file.relative}`);
        }

        const document = results && results.script ? results.script : {};

        const config = {};
        let code = '';

        // Extract metadata
        if (this.tagNotEmpty(document.metadata)) {
          // TODO: Warn on multiple metadata tags

          const meta = document.metadata[0];

          // - Icon
          if (this.tagNotEmpty(meta.icon)) {
            const icon = meta.icon[0];
            config.icon = icon.$ || {};
            config.icon.content = icon._ || '';
          }

          // - Visible
          if (this.tagNotEmpty(meta.visible)) {
            config.visible = Boolean(meta.visible[0]);
          }

          // - Title
          if (this.tagNotEmpty(meta.title)) {
            config.title = meta.title[0];
          }

          // - Description
          if (this.tagNotEmpty(meta.description)) {
            config.description = meta.description[0];
          }
        }

        // Extract Parameters
        if (this.tagNotEmpty(document.parameter)) {
          config.parameters = [];
          document.parameter.forEach(param => config.parameters.push(param.$));
        }

        // Extract JavaScript
        if (this.tagNotEmpty(document.code)) {
          code = document.code[0];
        }

        // Write config file
        const configFile = ScriptTransformer.splitFile(file, '.json');
        configFile.contents = Buffer.from(JSON.stringify(config, null, '  '));
        this.push(configFile);

        // Write script file
        const scriptFile = ScriptTransformer.splitFile(file, '.js');
        scriptFile.contents = Buffer.from(code);
        this.push(scriptFile);

        callback(null);
      }
    });
  }

  /**
   * Creates a script from the collected files.
   * @param {Map<String, AtviseFile>} files The collected files, stored against their extension.
   * @param {AtviseFile} lastFile The last file read. *Used for error messages only*.
   * @param {function(err: ?Error, data: vinyl~File)} callback Called with the error that occured
   * while creating the script or the resulting file.
   */
  createCombinedFile(files, lastFile, callback) {
    const configFile = files['.json'];
    let config = {};

    if (configFile) {
      try {
        config = JSON.parse(configFile.contents.toString());
      } catch (e) {
        callback(new Error(`Error parsing JSON in ${configFile.relative}: ${e.message}`));
        return;
      }
    }

    const scriptFile = files['.js'];
    let code = '';

    if (scriptFile) {
      code = scriptFile.contents.toString();
    }

    const result = {
      script: { },
    };

    // Insert metadata
    if (lastFile.isQuickDynamic) {
      const meta = {};

      // - Icon
      if (config.icon) {
        const icon = config.icon.content;
        delete config.icon.content;

        meta.icon = {
          $: config.icon,
          _: icon,
        };
      }

      // - Other fields
      if (config.visible !== undefined) {
        meta.visible = config.visible ? 1 : 0;
      }

      if (config.title !== undefined) {
        meta.title = config.title;
      }

      if (config.description !== undefined) {
        meta.description = config.description;
      }

      result.script.metadata = meta;
    }

    // Insert parameters
    result.script.parameter = config.parameters ?
      config.parameters.map(param => ({ $: param })) :
      [];

    result.script.code = ScriptTransformer.forceCData(code);

    const script = ScriptTransformer.combineFiles(
      Object.keys(files).map(ext => files[ext]),
      '.xml'
    );

    this.encodeContents(result, (encodeErr, xmlString) => {
      if (encodeErr) {
        callback(encodeErr);
      } else {
        script.contents = Buffer.from(xmlString);

        callback(null, script);
      }
    });
  }

}
