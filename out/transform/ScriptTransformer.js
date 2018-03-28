'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _XMLTransformer = require('../lib/transform/XMLTransformer');

var _XMLTransformer2 = _interopRequireDefault(_XMLTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A transformer that splits atvise scripts and quick dynamics into a code file and a .json file
 * containing parameters and metadata.
 */
class ScriptTransformer extends _XMLTransformer2.default {

  /**
   * Returns `true` for all files containing script code or quick dynamics.
   * @param {AtviseFile} file The file to check.
   * @return {boolean} `true` for all files containing script code or quick dynamics.
   */
  shouldBeTransformed(file) {
    return file.isScript || file.isQuickDynamic;
  }

  /**
   * Splits any read files containing scripts or quick dynamics into their JavaScript sources,
   * alongside with a json file containing parameters and metadata.
   * @param {AtviseFile} file The script file to split.
   * @param {string} enc The encoding used.
   * @param {function(err: Error, file: AtviseFile)} callback Called with the error that occured
   * while transforming the script, or the file passed through.
   */
  transformFromDB(file, enc, callback) {
    this.decodeContents(file, (err, results) => {
      if (err) {
        callback(err);
      } else {
        const document = results && this.findChild(results, 'script');

        if (!document) {
          _gulplog2.default.warn(`Empty document at ${file.relative}`);
        }

        const config = {};

        // Extract metadata
        const metaTag = this.findChild(document, 'metadata');
        if (metaTag && metaTag.elements) {
          // TODO: Warn on multiple metadata tags
          metaTag.elements.forEach(child => {
            if (child.type === 'element') {
              if (child.name === 'icon') {
                // - Icon
                config.icon = Object.assign({
                  content: this.textContent(child) || ''
                }, child.attributes);
              } else if (child.name === 'visible') {
                // - Visible
                config.visible = Boolean(parseInt(this.textContent(child), 10));
              } else if (child.name === 'title') {
                config.title = this.textContent(child);
              } else if (child.name === 'description') {
                config.description = this.textContent(child);
              } else {
                _gulplog2.default.warn(`Unknown metadata element '${child.name}' at ${file.relative}`);
              }
            }
          });
        }

        // Extract Parameters
        const paramTags = this.findChildren(document, 'parameter');
        if (paramTags.length) {
          config.parameters = [];
          paramTags.forEach(({ attributes }) => config.parameters.push(attributes));
        }

        // Extract JavaScript
        const codeNode = this.findChild(document, 'code');
        const code = this.textContent(codeNode) || '';

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

    const document = {
      type: 'element',
      name: 'script',
      elements: []
    };

    const result = {
      elements: [document]
    };

    // Insert metadata
    if (lastFile.isQuickDynamic) {
      const meta = [];

      // - Icon
      if (config.icon) {
        const icon = config.icon.content;
        delete config.icon.content;

        meta.push({
          type: 'element',
          name: 'icon',
          attributes: config.icon,
          elements: [{
            type: 'text',
            text: icon
          }]
        });
      }

      // - Other fields
      if (config.visible !== undefined) {
        meta.push({
          type: 'element',
          name: 'visible',
          elements: [{
            type: 'text',
            text: config.visible ? 1 : 0
          }]
        });
      }

      if (config.title !== undefined) {
        meta.push({
          type: 'element',
          name: 'title',
          elements: [{ type: 'text', text: config.title }]
        });
      }

      if (config.description !== undefined) {
        meta.push({
          type: 'element',
          name: 'description',
          elements: [{ type: 'text', text: config.description }]
        });
      }

      document.elements.push({
        type: 'element',
        name: 'metadata',
        elements: meta
      });
      // result.script.metadata = meta;
    }

    // Insert parameters
    if (config.parameters) {
      config.parameters.forEach(attributes => {
        document.elements.push({
          type: 'element',
          name: 'parameter',
          attributes
        });
      });
    }

    // Insert script code
    document.elements.push({
      type: 'element',
      name: 'code',
      elements: [{
        type: 'cdata',
        cdata: code
      }]
    });

    const script = ScriptTransformer.combineFiles(Object.keys(files).map(ext => files[ext]), '.xml');

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
exports.default = ScriptTransformer;
//# sourceMappingURL=ScriptTransformer.js.map