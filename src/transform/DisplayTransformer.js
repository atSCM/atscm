import { Buffer } from 'buffer';
import Logger from 'gulplog';
import sortJSON from 'sort-json';
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
    this.decodeContents(file, (err, xmlObj) => {
      if (err) {
        Logger.error(`Display ${file.nodeId}: Error parsing display content.`,
          'Check if display content is broken');
        callback(null);
      } else if (xmlObj.children.length === 0) {
        Logger.error(`Display ${file.nodeId}: Xml object is empty`);
        callback(null);
      } else {
        const rootSVG = xmlObj.find('svg').children[0];

        if (rootSVG) {
          try {
            let scriptFileAdded = false;
            const config = { parameters: [], dependencies: [] };
            const displayContent = rootSVG.children;

            const scriptFile = DisplayTransformer.splitFile(file, '.js');
            const configFile = DisplayTransformer.splitFile(file, '.json');
            const svgFile = DisplayTransformer.splitFile(file, '.svg');

            // Filter for script tags in display
            const scripts = displayContent.filter((tag, index) => {
              if (tag.name === 'script') {
                delete displayContent[index];
                return true;
              }
              return false;
            });

            // Filter for metadata tags in display
            const metadata = rootSVG.find('metadata').children;

            // Extract JavaScript
            scripts.map((script) => {
              const attributes = script.attrs;

              if (attributes.src || attributes['xlink:href']) {
                config.dependencies.push(attributes.src || attributes['xlink:href']);
              } else if (scriptFileAdded) {
                Logger.warn(`Display ${file.nodeId}:`,
                  'atscm only supports one inline script per display');
              } else {
                scriptFileAdded = true;
                scriptFile.contents = Buffer.from(script.toString());
              }

              return false;
            });


            // Extract display parameters
            if (metadata.length > 0) {
              const meta = metadata[0].children;
              const nonParameterTags = [];

              if (metadata.length > 1) {
                Logger.warn(`Display ${file.nodeId}:`,
                  'atscm only supports one metadata tag per display');
                metadata.splice(1, metadata.length);
              }

              meta.forEach(tag => {
                if (tag.name === 'atv:parameter') {
                  config.parameters.push(tag.attrs);
                } else {
                  nonParameterTags.push(tag);
                }
              });

              // overwrite meta data tag items, deleting items directly in metadata
              // tag made serialize function ignore
              // the remaining entries
              metadata[0].children = nonParameterTags;
            }

            configFile.contents = Buffer.from(
              JSON.stringify(sortJSON(config), null, '  ')
            );

            this.encodeContents(xmlObj, (encodeError, xmlString) => {
              if (encodeError) {
                Logger.error(`Display ${file.nodeId}: Could not encode svg file`);
              } else {
                svgFile.contents = Buffer.from(xmlString);
                this.push(svgFile);
                this.push(configFile);
                this.push(scriptFile);
              }

              callback(null);
            });
          } catch (e) {
            callback(e);
          }
        } else {
          Logger.error(`Display ${file.nodeId}: Can not decode display. Missing 'svg' tag`);
          callback(null);
        }
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
    const svgFile = files['.svg'];
    const configFile = files['.json'];
    const scriptFile = files['.js'];

    let config = {};
    let inlineScript = '';

    if (!svgFile) {
      callback(new Error(`No display SVG in ${lastFile.dirname}`));
      return;
    }

    if (configFile) {
      try {
        config = JSON.parse(configFile.contents.toString());
      } catch (e) {
        callback(new Error(`Error parsing JSON in ${configFile.relative}: ${e.message}`));
        return;
      }
    }

    if (scriptFile) {
      inlineScript = scriptFile.contents.toString();
    }

    this.decodeContents(svgFile, (err, xmlObj) => {
      if (err) {
        Logger.error(`Display ${svgFile.nodeId}: Error parsing display content.
          Message: ${err.message}`);
        callback(null);
      } else {
        try {
          const displayContent = xmlObj.children[0];
          const metadata = xmlObj.find('*/metadata');
          const parameters = config.parameters.reverse();
          const dependencies = config.dependencies;
          const display = DisplayTransformer.combineFiles(
            Object.keys(files).map(ext => files[ext]),
            '.xml'
          );

          // Insert parameters
          if (parameters && parameters.length > 0) {
            if (metadata.children[0]) {
              const meta = metadata.children[0].children;

              parameters.forEach(param => meta.unshift(this.createTag('atv:parameter',
                param, metadata)));
            } else {
              Logger.error(`Display ${svgFile.nodeId}: Metadata tag is missing.`,
                'Can not append parameters');
            }
          }

          // Insert dependencies
          if (dependencies && dependencies.length > 0) {
            dependencies.forEach(dependency => displayContent.children
              .push(this.createTag('script', { 'xlink:href': dependency, type: 'text/ecmascript' },
                metadata)));
          }

          // Insert script
          if (scriptFile) {
            const script = this.createTag('script', { type: 'text/ecmascript' }, displayContent);

            script.append(this.createCData(inlineScript));
            displayContent.children.push(script);
          }

          this.encodeContents(xmlObj, (encodeError, xmlString) => {
            if (encodeError) {
              Logger.error(`Display ${svgFile.nodeId}: Could not encode svg file`);
              callback(null);
            } else {
              display.contents = Buffer.from(xmlString);
              callback(null, display);
            }
          });
        } catch (e) {
          callback(e);
        }
      }
    });
  }

}
