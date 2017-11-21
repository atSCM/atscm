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
    this.decodeContents(file, (err, xmlObj) => {
      if (err) {
        _gulplog2.default.error(`Display ${file.nodeId}: Error parsing script content.`, 'Check if script content is empty or broken');
        callback(null);
      } else if (xmlObj.children.length === 0 || xmlObj.children[0].name !== 'script') {
        _gulplog2.default.error(`Script ${file.nodeId}: Can not decode script. Missing 'script' tag`);
        callback(null);
      } else {
        const configFile = ScriptTransformer.splitFile(file, '.json');
        const scriptFile = ScriptTransformer.splitFile(file, '.js');

        const config = { parameters: [] };

        // Filter for metadata tags in script
        const metadata = xmlObj.find('*/metadata').children;

        // Filter for parameters in script
        const parameters = xmlObj.find('*/parameter').children;

        // Filter for code tags
        let code = xmlObj.find('*/code').children;

        // Extract metadata
        if (metadata.length > 0) {
          const meta = metadata[0];
          config.metadata = [];

          if (metadata.length > 1) {
            _gulplog2.default.warn(`Script ${file.nodeId}: `, 'atscm only supports one metadata tag per script');
          }

          meta.forEach(tag => config.metadata.push({ name: tag.name, attrs: tag.attrs, value: tag.text() }));
        }

        // Extract Parameters
        if (parameters.length > 0) {
          parameters.forEach(param => {
            const paramObj = param.attrs;

            if (paramObj.relative === 'true') {
              const targetName = param.find('*/*/*/TargetName');

              if (targetName.children.length > 0) {
                const nameSpaceIndex = targetName.find('*/NamespaceIndex').eq(0);
                const nodePath = targetName.find('*/Name').eq(0);

                // add relative path information
                paramObj.relPath = {
                  nameSpaceIndex: nameSpaceIndex.text(),
                  nodePath: nodePath.text()
                };
              }
            }
            config.parameters.push(paramObj);
          });
        }

        if (code.length === 0) {
          _gulplog2.default.warn(`Script ${file.nodeId}: No script content defined`);
        }

        // Extract JavaScript
        code = code.toString();

        // Write config and script file
        configFile.contents = Buffer.from(JSON.stringify(config, null, '  '));
        scriptFile.contents = Buffer.from(code);

        this.push(configFile);
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
    const scriptFile = files['.js'];

    let config = {};
    const xmlObj = {};

    const script = this.createTag('script', {}, xmlObj);
    const metadata = this.createTag('metadata', {}, script);
    const code = this.createTag('code', {}, script);
    const combinedFile = ScriptTransformer.combineFiles(Object.keys(files).map(ext => files[ext]), '.xml');

    if (configFile) {
      try {
        config = JSON.parse(configFile.contents.toString());
      } catch (e) {
        _gulplog2.default.warn(`Script ${configFile.nodeId}: Error paring config file`);
        callback(null);
        return;
      }
    }

    // Add metadata to script
    if (config.metadata) {
      config.metadata.forEach(tag => metadata.append(this.createTag(tag.name, tag.attrs, metadata, tag.value)));
      script.append(metadata);
    }

    // Add parameters to script
    if (config.parameters) {
      config.parameters.forEach(param => {
        let relPath;

        if (param.relative === 'true') {
          relPath = this.createRelPathTag(param.relPath);
          // eslint-disable-next-line no-param-reassign
          delete param.relPath;
        }

        script.append(this.createTag('parameter', param, script, relPath));
      });
    }

    // Add CData content to script
    if (scriptFile) {
      code.append(this.createCData(scriptFile.contents.toString()));
      script.append(code);
    }

    this.encodeContents(this.createNodeSet(script), (encodeErr, xmlString) => {
      if (encodeErr) {
        _gulplog2.default.error(`Script ${combinedFile.nodeId}: Could not encode script file`);
        callback(null);
      } else {
        combinedFile.contents = Buffer.from(xmlString);

        callback(null, combinedFile);
      }
    });
  }

}
exports.default = ScriptTransformer;
//# sourceMappingURL=ScriptTransformer.js.map