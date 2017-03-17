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
    this.decodeContents(file, (err, results) => {
      if (err) {
        callback(err);
      } else if (!results || results.svg === undefined) {
        callback(new Error('Error parsing display: No `svg` tag'));
      } else {
        const xml = results;
        const document = results.svg;

        const config = {};

        // Extract JavaScript
        if (this.tagNotEmpty(document.script)) {
          document.script.forEach(script => {
            if (script.$ && (script.$.src || script.$['xlink:href'])) {
              if (!config.dependencies) {
                config.dependencies = [];
              }

              config.dependencies.push(script.$.src || script.$['xlink:href']);
            } else {
              // TODO: Warn on multiple inline scripts

              const scriptFile = DisplayTransformer.splitFile(file, '.js');
              const scriptText = (typeof script === 'string') ?
                script : script._ || '';

              scriptFile.contents = Buffer.from(scriptText);
              this.push(scriptFile);
            }
          });

          delete xml.svg.script;
        }

        // Extract metadata
        if (this.tagNotEmpty(document.metadata)) {
          // TODO: Warn on multiple metadata tags

          const meta = document.metadata[0];

          // - Parameters
          if (this.tagNotEmpty(meta['atv:parameter'])) {
            config.parameters = [];
            meta['atv:parameter'].forEach(param => config.parameters.push(param.$));

            delete xml.svg.metadata[0]['atv:parameter'];
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
      } else if (!xml || xml.svg === undefined) {
        callback(new Error('Error parsing display SVG: No `svg` tag'));
      } else {
        const result = xml;

        // Handle empty svg tag
        if (typeof result.svg === 'string') {
          result.svg = {};
        }

        // Insert dependencies
        result.svg.script = [];
        if (config.dependencies) {
          config.dependencies.forEach(p => result.svg.script.push({
            $: { 'xlink:href': p },
          }));
        }

        // Insert script
        // FIXME: Import order is not preserved!
        if (scriptFile) {
          result.svg.script.push({
            $: { type: 'text/ecmascript' },
            _: XMLTransformer.forceCData(inlineScript),
          });
        }

        // Insert metadata
        // - Parameters
        if (config.parameters && config.parameters.length > 0) {
          if (!result.svg.metadata || !result.svg.metadata[0]) {
            result.svg.metadata = [{}];
          }
          if (!result.svg.metadata[0]['atv:parameter']) {
            result.svg.metadata[0]['atv:parameter'] = [];
          }

          // FIXME: Parameters should come before `atv:gridconfig` and `atv:snapconfig`
          config.parameters
            .forEach(param => result.svg.metadata[0]['atv:parameter'].push({ $: param }));
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
