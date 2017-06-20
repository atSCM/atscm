import Logger from 'gulplog';
import { DOMParser } from 'xmldom';
import XMLTransformer from '../lib/transform/XMLTransformer';

/**
 * A transformer that splits atvise scripts and quick dynamics into a code file and a .json file
 * containing parameters and metadata.
 */
export default class ScriptTransformer extends XMLTransformer {

  /**
   * Creates a new Transformer instance.
   * @param {Object} options The transformer options to use.
   */
  constructor(options) {
    super(options);

    /**
     * The template document to base script output on.
     * @type {DOMDocument}
     */
    this._template = (new DOMParser()).parseFromString('<script></script>');
  }

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
    // Helpers

    function processSingleTag(doc, name, process) {
      let result;

      Array.from(doc.getElementsByTagName(name)).forEach((n, i) => {
        if (i === 0) {
          result = process(n);
        } else if (i === 1) {
          Logger.warn(`Multiple ${name} tags found in ${file.relative}`);
        }
      });

      return result;
    }

    function singleTagValue(doc, name) {
      return processSingleTag(doc, name, n => n.textContent);
    }

    this.decodeContents(file, (err, doc) => {
      if (err) {
        callback(err);
      } else {
        const config = {};
        let code = '';

        if (!doc || !doc.documentElement || doc.documentElement.tagName !== 'script') {
          Logger.warn(`Empty document at ${file.relative}`);
        } else {
          // Extract Metadata

          // - Icon
          processSingleTag(doc, 'icon', n => {
            config.icon = this.getElementAttributes(n);
            config.icon.content = n.textContent;
          });

          // - Visible
          const v = singleTagValue(doc, 'visible');
          config.visible = v && Boolean(v);

          // - Title
          config.title = singleTagValue(doc, 'title');

          // - Description
          config.description = singleTagValue(doc, 'description');

          // Extract parameters
          config.parameters = Array.from(doc.getElementsByTagName('parameter'))
            .map(p => this.getElementAttributes(p));

          code = singleTagValue(doc, 'code') || '';
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

    const doc = this._template.cloneNode(true);

    if (lastFile.isQuickDynamic) {
      // Insert metadata

      const meta = doc.createElement('metadata');
      doc.documentElement.appendChild(meta);

      // - Icon
      if (config.icon) {
        const content = config.icon.content;
        delete config.icon.content;

        this.appendNode(doc, 'icon', Object.assign({
          textContent: content,
        }, config.icon), meta);
      }

      if (config.visible !== undefined) {
        this.appendNode(doc, 'visible', { textContent: config.visible ? 1 : 0 }, meta);
      }

      if (config.title !== undefined) {
        this.appendNode(doc, 'title', { textContent: config.title }, meta);
      }

      if (config.description !== undefined) {
        this.appendNode(doc, 'description', { textContent: config.description }, meta);
      }
    }

    // Insert parameters

    (config.parameters || []).forEach(p => this.appendNode(doc, 'parameter', p));

    // Insert code
    this.appendNode(doc, 'code')
      .appendChild(doc.createCDATASection(code));

    const script = ScriptTransformer.combineFiles(
      Object.keys(files).map(ext => files[ext]),
      '.xml'
    );

    this.encodeContents(doc, (encodeErr, xmlString) => {
      if (encodeErr) {
        callback(encodeErr);
      } else {
        script.contents = Buffer.from(xmlString);

        callback(null, script);
      }
    });
  }

}
