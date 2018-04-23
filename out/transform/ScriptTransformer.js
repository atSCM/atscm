'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _XMLTransformer = require('../lib/transform/XMLTransformer');

var _XMLTransformer2 = _interopRequireDefault(_XMLTransformer);

var _xml = require('../lib/helpers/xml');

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
        const document = results && (0, _xml.findChild)(results, 'script');

        if (!document) {
          _gulplog2.default.warn(`Empty document at ${file.relative}`);
        }

        const config = {};

        // Extract metadata
        const metaTag = (0, _xml.findChild)(document, 'metadata');
        if (metaTag && metaTag.elements) {
          // TODO: Warn on multiple metadata tags
          metaTag.elements.forEach(child => {
            if (child.type === 'element') {
              if (child.name === 'icon') {
                // - Icon
                config.icon = Object.assign({
                  content: (0, _xml.textContent)(child) || ''
                }, child.attributes);
              } else if (child.name === 'visible') {
                // - Visible
                config.visible = Boolean(parseInt((0, _xml.textContent)(child), 10));
              } else if (child.name === 'title') {
                config.title = (0, _xml.textContent)(child);
              } else if (child.name === 'description') {
                config.description = (0, _xml.textContent)(child);
              } else {
                if (!config.metadata) {
                  config.metadata = {};
                }

                const value = (0, _xml.textContent)(child);

                if (config.metadata[child.name]) {
                  if (!Array.isArray(config.metadata[child.name])) {
                    config.metadata[child.name] = [config.metadata[child.name]];
                  }

                  config.metadata[child.name].push(value);
                } else {
                  config.metadata[child.name] = (0, _xml.textContent)(child);
                }

                if (!['longrunning'].includes(child.name)) {
                  _gulplog2.default.debug(`Generic metadata element '${child.name}' at ${file.relative}`);
                }
              }
            }
          });
        }

        // Extract Parameters
        const paramTags = (0, _xml.findChildren)(document, 'parameter');
        if (paramTags.length) {
          config.parameters = [];
          paramTags.forEach(({ attributes, elements }) => {
            const param = Object.assign({}, attributes);

            // Handle relative parameter targets
            if (attributes.relative === 'true') {
              param.target = {};

              const target = (0, _xml.findChild)(elements[0], ['Elements', 'RelativePathElement', 'TargetName']);

              if (target) {
                const [index, name] = ['NamespaceIndex', 'Name'].map(tagName => (0, _xml.textContent)((0, _xml.findChild)(target, tagName)));

                const parsedIndex = parseInt(index, 10);

                param.target = { namespaceIndex: isNaN(parsedIndex) ? 1 : parsedIndex, name };
              }
            }

            config.parameters.push(param);
          });
        }

        // Extract JavaScript
        const codeNode = (0, _xml.findChild)(document, 'code');
        const code = (0, _xml.textContent)(codeNode) || '';

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

    const document = (0, _xml.createElement)('script', []);

    const result = {
      elements: [document]
    };

    // Insert metadata
    const meta = [];

    if (lastFile.isQuickDynamic) {
      // - Icon
      if (config.icon) {
        const icon = config.icon.content;
        delete config.icon.content;

        meta.push((0, _xml.createElement)('icon', [(0, _xml.createTextNode)(icon)], config.icon));
      }

      // - Other fields
      if (config.visible !== undefined) {
        meta.push((0, _xml.createElement)('visible', [(0, _xml.createTextNode)(`${config.visible ? 1 : 0}`)]));
      }

      if (config.title !== undefined) {
        meta.push((0, _xml.createElement)('title', [(0, _xml.createTextNode)(config.title)]));
      }

      if (config.description !== undefined) {
        meta.push((0, _xml.createElement)('description', [(0, _xml.createTextNode)(config.description)]));
      }
    }

    // - Additional fields
    if (config.metadata !== undefined) {
      Object.entries(config.metadata).forEach(([name, value]) => {
        (Array.isArray(value) ? value : [value]).forEach(v => meta.push((0, _xml.createElement)(name, [(0, _xml.createTextNode)(v)])));
      });
    }

    if (lastFile.isQuickDynamic || meta.length) {
      document.elements.push((0, _xml.createElement)('metadata', meta));
    }

    // Insert parameters
    if (config.parameters) {
      config.parameters.forEach(attributes => {
        let elements;

        // Handle relative parameter targets
        if (attributes.relative === 'true' && attributes.target) {
          const { namespaceIndex, name } = attributes.target;
          const targetElements = (0, _xml.createElement)('Elements');

          elements = [(0, _xml.createElement)('RelativePath', [targetElements])];

          if (name !== undefined) {
            targetElements.elements = [(0, _xml.createElement)('RelativePathElement', [(0, _xml.createElement)('TargetName', [(0, _xml.createElement)('NamespaceIndex', [(0, _xml.createTextNode)(`${namespaceIndex}`)]), (0, _xml.createElement)('Name', [(0, _xml.createTextNode)(`${name}`)])])])];
          }

          // eslint-disable-next-line no-param-reassign
          delete attributes.target;
        }

        document.elements.push((0, _xml.createElement)('parameter', elements, attributes));
      });
    }

    // Insert script code
    document.elements.push((0, _xml.createElement)('code', [(0, _xml.createCDataNode)(code)]));

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