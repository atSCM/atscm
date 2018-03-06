import { Buffer } from 'buffer';
import XMLTransformer from '../lib/transform/XMLTransformer';

/**
 * Splits read atvise display XML nodes into their SVG and JavaScript sources,
 * alongside with a .json file containing the display's parameters.
 */
export default class DisplayTransformer extends XMLTransformer {

  /**
   * Returns true for all files containing atvise displays.
   * @param {AtviseFile} file The file to check.
   * @return {boolean} `true` for all atvise display files.
   */
  shouldBeTransformed(file) {
    return file.isDisplay;
  }

  /**
   * Splits any read files containing atvise displays into their SVG and JavaScript sources,
   * alongside with a json file containing the display's parameters.
   * @param {AtviseFile} file The display file to split.
   * @param {string} enc The encoding used.
   * @param {function(err: Error, file: AtviseFile)} callback Called with the error that occured
   * while transforming the display, or the file passed through.
   */
  transformFromDB(file, enc, callback) {
    this.decodeContents(file, (err, results) => {
      if (err) {
        callback(err);
      } else if (!results) {
        callback(new Error('Error parsing display: No `svg` tag'));
      } else {
        const xml = results;
        const document = this.findChild(xml, 'svg');

        if (!document) {
          callback(new Error('Error parsing display: No `svg` tag'));
          return;
        }

        const config = {};
        const scriptTags = this.removeChildren(document, 'script');

        // Extract JavaScript
        if (scriptTags.length) {
          scriptTags.forEach(script => {
            if (script.attributes && (script.attributes.src || script.attributes['xlink:href'])) {
              if (!config.dependencies) {
                config.dependencies = [];
              }

              config.dependencies.push(script.attributes.src || script.attributes['xlink:href']);
            } else {
              // TODO: Warn on multiple inline scripts

              const scriptContentNode = script.elements ?
                script.elements[0] :
                { type: 'text', text: '' };

              const scriptFile = DisplayTransformer.splitFile(file, '.js');

              const scriptText = scriptContentNode[scriptContentNode.type] || '';

              scriptFile.contents = Buffer.from(scriptText);
              this.push(scriptFile);
            }
          });
        }

        // Extract metadata
        const metaTag = this.findChild(document, 'metadata');
        if (metaTag && metaTag.elements) {
          // TODO: Warn on multiple metadata tags

          // - Parameters
          const paramTags = this.removeChildren(metaTag, 'atv:parameter');
          if (paramTags.length) {
            config.parameters = [];

            paramTags.forEach(({ attributes }) => config.parameters.push(attributes));
          }
        }

        const configFile = DisplayTransformer.splitFile(file, '.json');

        configFile.contents = Buffer.from(JSON.stringify(config, null, '  '));
        this.push(configFile);

        const svgFile = DisplayTransformer.splitFile(file, '.svg');

        this.encodeContents(xml, (encodeErr, stringValue) => {
          if (encodeErr) {
            callback(encodeErr);
          } else {
            svgFile.contents = Buffer.from(stringValue);
            this.push(svgFile);

            callback(null);
          }
        });
      }
    });
  }

  /**
   * Creates a display from the collected files.
   * @param {Map<String, vinyl~File>} files The collected files, stored against their extension.
   * @param {vinyl~File} lastFile The last file read. *Used for error messages only*.
   * @param {function(err: ?Error, data: vinyl~File)} callback Called with the error that occured
   * while creating the display or the resulting file.
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

    const svgFile = files['.svg'];
    if (!svgFile) {
      callback(new Error(`No display SVG in ${lastFile.dirname}`));
      return;
    }

    const scriptFile = files['.js'];
    let inlineScript = '';
    if (scriptFile) {
      inlineScript = scriptFile.contents.toString();
    }

    this.decodeContents(svgFile, (err, xml) => {
      if (err) {
        callback(err);
      } else {
        const result = xml;
        const svg = this.findChild(result, 'svg');

        if (!svg) {
          callback(new Error('Error parsing display SVG: No `svg` tag'));
          return;
        }

        // Handle empty svg tag
        if (!svg.elements) {
          svg.elements = [];
        }

        // Insert dependencies
        if (config.dependencies) {
          config.dependencies.forEach(src => {
            svg.elements.push({
              type: 'element',
              name: 'script',
              attributes: { 'xlink:href': src },
            });
          });
        }

        // Insert script
        // FIXME: Import order is not preserved!
        if (scriptFile) {
          svg.elements.push({
            type: 'element',
            name: 'script',
            attributes: { type: 'text/ecmascript' },
            elements: [
              {
                type: 'cdata',
                cdata: inlineScript,
              },
            ],
          });
        }

        // Insert metadata
        // - Parameters
        if (config.parameters && config.parameters.length > 0) {
          let metaTag = this.removeChild(svg, 'metadata');

          if (!metaTag) {
            metaTag = { type: 'element', name: 'metadata' };
          }

          if (!metaTag.elements) {
            metaTag.elements = [];
          }

          // Parameters should come before other atv attributes, e.g. `atv:gridconfig`
          for (let i = config.parameters.length - 1; i >= 0; i--) {
            metaTag.elements.unshift({
              type: 'element',
              name: 'atv:parameter',
              attributes: config.parameters[i],
            });
          }

          // Insert <metadata> as first element in the resulting svg
          svg.elements.unshift(metaTag);
        }

        const display = DisplayTransformer.combineFiles(
          Object.keys(files).map(ext => files[ext]),
          '.xml'
        );

        this.encodeContents(result, (encodeErr, xmlString) => {
          if (encodeErr) {
            callback(encodeErr);
          } else {
            display.contents = Buffer.from(xmlString);

            callback(null, display);
          }
        });
      }
    });
  }

}
