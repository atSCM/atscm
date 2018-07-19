import { readdir } from 'fs';
import { extname, basename, join, dirname } from 'path';
import PartialTransformer from './PartialTransformer';
import { TransformDirection } from './Transformer';

/**
 * Determines which files are needed to create a combined file and stores these files as long as
 * some of them are missing.
 */
export class CombineFilesCache {

  /**
   * Creates a new DisplayCache.
   */
  constructor() {
    /**
     * The files caches for the given path.
     * @type {Map<String, Node>}
     */
    this._files = {};

    /**
     * The extensions of the files required.
     * @type {String[]}
     */
    this._required = {};
    this._waitingFor = {};

    this._wrappers = new Map();
  }

  /**
   * Returns the extensions of the missing files for the given `dir`.
   * @param {string} dir The cache key to look for.
   * @return {String[]} Extensions of the missing files.
   */
  missingExtensions(dir) {
    const required = this._required[dir];
    const files = this._files[dir];

    return required.filter(ext => files[ext] === undefined);
  }

  /**
   * Checks if, when `file` is added, all required files are cached.
   * @param {SourceNode} node The node to add before checking.
   * @param {function(err: ?Error, files: ?Map<string, Node>)} callback Called with the error
   * that occured while checking or all source nodes of `node` if all required files are already
   * cached.
   */
  gotAllFiles(node, callback) {
    if (this._waitingFor[node.relative]) {
      const wrapper = dirname(node.relative);

      this._files[wrapper][extname(node.relative)] = node;

      if (this.missingExtensions(wrapper).length === 0) {
        const files = this._files[wrapper];
        callback(null, this._wrappers.get(wrapper), files);

        delete this._files[wrapper];
        delete this._required[wrapper];
      } else {
        callback(null);
      }

      delete this._waitingFor[node.relative];
      return;
    }

    const wrapperExt = extname(node.relative);
    const wrapperName = basename(node.relative, wrapperExt);
    this._wrappers.set(node.relative, node);

    readdir(node.relative, (err, files) => {
      if (err) {
        callback(err);
      } else {
        this._files[node.relative] = {};
        this._required[node.relative] = files
          .filter(name => name[0] !== '.' &&
            !name.endsWith(wrapperExt) &&
            name.match(new RegExp(`^${wrapperName}\\..+`)))
          .map(name => {
            this._waitingFor[join(node.relative, name)] = true;
            return extname(name);
          });

        callback(null);
      }
    });
  }

  hasWrapper(key) {
    return this._wrappers.has(key);
  }

}

/**
 * A transformer that splits files into multiple others.
 * @abstract
 */
export default class SplittingTransformer extends PartialTransformer {

  /**
   * Creates a new SplittingTransformer.
   * @param {Object} options The options to apply.
   */
  constructor(options) {
    super(options);

    /**
     * The cache used when collecting files to combine.
     * @type {CombineFilesCache}
     */
    this._combineFilesCache = new CombineFilesCache();
  }

  /**
   * Returns `true` for all nodes the transformer currently waits for (works only when transforming
   * from the filesystem). For example: In the {@link DisplayTransformer} class it returns `true`
   * for all display source files, which are a *json*, a *svg* and optionally a *js* file.
   * @param {Node} node The node to check.
   */
  shouldBeTransformed(node) {
    if (this.direction === TransformDirection.FromDB) { return false; }

    return this._combineFilesCache._waitingFor[node.relative] || false;
  }

  /**
   * Creates a combined node from the cached source nodes.
   * @param {Node} node The node collected. This is the only node guaranteed to be
   * set, therefore us if for error messages, etc.
   * @param {Map<string, Node>} sources The cached files stored against their extensions.
   * @param {function(err: ?Error, data: ?Node)} callback Should be called with any errors
   * that occur while combining the files, or optionally the resulting file.
   * @abstract
   */
  createCombinedFile(node, sources, callback) { // eslint-disable-line no-unused-vars
    throw new Error(
      'SplittingTransformer#createCombinedFile must be implemented by all subclasses'
    );
  }

  /**
   * Calls {@link SplittingTransformer#createCombinedFile} as soon as all dependencies are
   * required files are cached.
   * @param {Node} node The read node.
   * @param {string} enc The encoding used.
   * @param {function(err: ?Error, data: ?Node)} callback Called with the error occured while
   * caching files or creating the combined file or optionally the resulting combined file.
   */
  transformFromFilesystem(node, enc, callback) {
    // console.error('transforming', file);
    this._combineFilesCache.gotAllFiles(node, (err, wrapper, allFiles) => {
      if (err) {
        callback(err);
      } else if (allFiles) {
        this.createCombinedFile(wrapper, allFiles, callback);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Splits a {@link Node}: The resulting is a clone of the input file, with a different path.
   * @param {Node} node The file to split.
   * @param {?String} newExtension The extension the resulting file gets.
   * @return {Node} The resulting node.
   */
  static splitFile(node, newExtension) {
    Object.assign(node, {
      fullyMapped: true,
      value: Object.assign(node.value, {
        noWrite: true,
      }),
    });

    return node.createChild({ extension: newExtension });
  }

  /**
   * If there are any missing files this method loads these files and calls
   * {SplittingTransformer#createCombinedFile} with them.
   * @param {function(err: ?Error)} callback Called with the error that occurred while loading
   * missing files.
   */
  _flush(callback) {
    const missingDirnames = Object.keys(this._combineFilesCache._files);

    if (missingDirnames.length > 0) {
      callback();
      // FIXME: Assert in push but not in watch task
      /* callback(new Error(`Incomplete mapping: Missing files for ${
        missingDirnames.join(', ')
      }`)); */
    } else {
      callback();
    }
  }

}

