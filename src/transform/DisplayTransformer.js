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
   * @return {Boolean} `true` for all atvise display files.
   */
  shouldBeTransformed(file) {
    return file.isDisplay;
  }

  /**
   * Splits any read files containing atvise displays into their SVG and JavaScript sources,
   * alongside with a .json file containing the display's parameters.
   * @param {AtviseFile} file The display file to split.
   * @param {String} enc The encoding used.
   * @param {function(err: Error, file: AtviseFile)} callback Called with the error that occured
   * while transforming the display, or the file passed through.
   */
  transformFromDB(file, enc, callback) {
    this.decodeContents(file, (err, doc) => {
      if (err) {
        callback(err);
      } else if (!doc || !doc.documentElement || doc.documentElement.tagName !== 'svg') {
        callback(new Error('Error parsing display: No `svg` tag'));
      } else {
        const config = {};

        // Extract JavaScript
        Array.from(doc.getElementsByTagName('script')).forEach(elm => {
          const src = elm.getAttribute('src') || elm.getAttribute('xlink:href');

          // Dependencies
          if (src) {
            if (!config.dependencies) {
              config.dependencies = [];
            }

            config.dependencies.push(src);
          } else { // Script code
            // TODO: Warn on multiple inline scripts

            const scriptFile = DisplayTransformer.splitFile(file, '.js');
            scriptFile.contents = Buffer.from(elm.textContent);
            this.push(scriptFile);
          }

          elm.parentNode.removeChild(elm);
        });

        // Extract parameters
        Array.from(doc.getElementsByTagName('atv:parameter')).forEach(elm => {
          if (!config.parameters) {
            config.parameters = [];
          }

          config.parameters.push(this.getElementAttributes(elm));
        });

        // Create config file

        const configFile = DisplayTransformer.splitFile(file, '.json');

        configFile.contents = Buffer.from(JSON.stringify(config, null, '  '));
        this.push(configFile);

        // Create svg file

        const svgFile = DisplayTransformer.splitFile(file, '.svg');

        this.encodeContents(doc, (encodeErr, stringValue) => {
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

    this.decodeContents(svgFile, (err, doc) => {
      if (err) {
        callback(err);
      } else if (!doc || !doc.documentElement || doc.documentElement.tagName !== 'svg') {
        callback(new Error('Error parsing display SVG: No `svg` tag'));
      } else {
        // Insert dependencies

        if (config.dependencies) {
          config.dependencies.forEach(p => this.appendNode(doc, 'script', {
            'xlink:href': p,
          }));
        }

        // Insert script

        if (scriptFile) {
          const n = this.createNode(doc, 'script', {
            type: 'text/ecmascript',
          });
          const data = doc.createCDATASection(inlineScript);

          n.appendChild(data);

          doc.documentElement.appendChild(n);
        }

        // Insert metadata

        if (config.parameters && config.parameters.length > 0) {
          let container = doc.getElementsByTagName('metadata');

          if (container.length > 0) {
            container = container[0];
          } else {
            container = this.createNode(doc, 'metadata');
            doc.documentElement.insertBefore(container, doc.documentElement.childNodes[0]);
          }

          config.parameters
            .forEach(attrs => this.appendNode(doc, 'atv:parameter', attrs, container));
        }

        // Create display

        const display = DisplayTransformer.combineFiles(
          Object.keys(files).map(ext => files[ext]),
          '.xml'
        );

        this.encodeContents(doc, (encodeErr, xmlString) => {
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
