import Logger from 'gulplog';
import XMLTransformer from '../lib/transform/XMLTransformer';
import {
  findChild, findChildren,
  textContent,
  createElement, createTextNode, createCDataNode,
} from '../lib/helpers/xml';

/**
 * A transformer that splits atvise scripts and quick dynamics into a code file and a .json file
 * containing parameters and metadata.
 */
export default class ScriptTransformer extends XMLTransformer {

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
        const document = results && findChild(results, 'script');

        if (!document) {
          Logger.warn(`Empty document at ${file.relative}`);
        }

        const config = {};

        // Extract metadata
        const metaTag = findChild(document, 'metadata');
        if (metaTag && metaTag.elements) {
          // TODO: Warn on multiple metadata tags
          metaTag.elements.forEach(child => {
            if (child.type === 'element') {
              if (child.name === 'icon') { // - Icon
                config.icon = Object.assign({
                  content: textContent(child) || '',
                }, child.attributes);
              } else if (child.name === 'visible') { // - Visible
                config.visible = Boolean(parseInt(textContent(child), 10));
              } else if (child.name === 'title') {
                config.title = textContent(child);
              } else if (child.name === 'description') {
                config.description = textContent(child);
              } else {
                if (!config.metadata) {
                  config.metadata = {};
                }

                const value = textContent(child);

                if (config.metadata[child.name]) {
                  if (!Array.isArray(config.metadata[child.name])) {
                    config.metadata[child.name] = [config.metadata[child.name], value];
                  } else {
                    config.metadata[child.name].push(value);
                  }
                } else {
                  config.metadata[child.name] = textContent(child);
                }

                if (![
                  'longrunning',
                ].includes(child.name)) {
                  Logger.debug(`Generic metadata element '${child.name}' at ${file.relative}`);
                }
              }
            }
          });
        }

        // Extract Parameters
        const paramTags = findChildren(document, 'parameter');
        if (paramTags.length) {
          config.parameters = [];
          paramTags.forEach(({ attributes, elements }) => {
            const param = Object.assign({}, attributes);

            // Handle relative parameter targets
            if (attributes.relative === 'true') {
              param.target = {};

              const target = findChild(elements[0],
                ['Elements', 'RelativePathElement', 'TargetName']);

              if (target) {
                const [index, name] = ['NamespaceIndex', 'Name']
                  .map(tagName => textContent(findChild(target, tagName)));

                const parsedIndex = parseInt(index, 10);

                param.target = { namespaceIndex: isNaN(parsedIndex) ? 1 : parsedIndex, name };
              }
            }

            config.parameters.push(param);
          });
        }

        // Extract JavaScript
        const codeNode = findChild(document, 'code');
        const code = textContent(codeNode) || '';

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

    const document = createElement('script', []);

    const result = {
      elements: [
        document,
      ],
    };

    // Insert metadata
    const meta = [];

    if (lastFile.isQuickDynamic) {
      // - Icon
      if (config.icon) {
        const icon = config.icon.content;
        delete config.icon.content;

        meta.push(createElement('icon', [createTextNode(icon)], config.icon));
      }

      // - Other fields
      if (config.visible !== undefined) {
        meta.push(createElement('visible', [createTextNode(`${config.visible ? 1 : 0}`)]));
      }

      if (config.title !== undefined) {
        meta.push(createElement('title', [createTextNode(config.title)]));
      }

      if (config.description !== undefined) {
        meta.push(createElement('description', [createTextNode(config.description)]));
      }
    }

    // - Additional fields
    if (config.metadata !== undefined) {
      Object.entries(config.metadata)
        .forEach(([name, value]) => {
          (Array.isArray(value) ? value : [value])
            .forEach(v => meta.push(createElement(name, [createTextNode(v)])));
        });
    }

    if (lastFile.isQuickDynamic || meta.length) {
      document.elements.push(createElement('metadata', meta));
    }

    // Insert parameters
    if (config.parameters) {
      config.parameters.forEach(attributes => {
        let elements;

        // Handle relative parameter targets
        if (attributes.relative === 'true' && attributes.target) {
          const { namespaceIndex, name } = attributes.target;
          const targetElements = createElement('Elements');

          elements = [createElement('RelativePath', [targetElements])];

          if (name !== undefined) {
            targetElements.elements = [
              createElement('RelativePathElement', [
                createElement('TargetName', [
                  createElement('NamespaceIndex', [createTextNode(`${namespaceIndex}`)]),
                  createElement('Name', [createTextNode(`${name}`)]),
                ]),
              ]),
            ];
          }

          // eslint-disable-next-line no-param-reassign
          delete attributes.target;
        }

        document.elements.push(createElement('parameter', elements, attributes));
      });
    }

    // Insert script code
    document.elements.push(createElement('code', [createCDataNode(code)]));

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
