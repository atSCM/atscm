import { readdir } from 'fs';
import { extname } from 'path';
import PartialTransformer from './PartialTransformer';

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
     * @type {Map<String, vinyl~File>}
     */
    this._files = {};

    /**
     * The extensions of the files required.
     * @type {String[]}
     */
    this._required = {};
  }

  /**
   * Checks if, when `file` is added, all required files are cached.
   * @param {vinyl~File} file The file to add before checking.
   * @param {function(err: ?Error, files: ?Map<String, vinyl~File>)} callback Called with the error
   * that occured while checking or all files related to `file` if all required files are already
   * cached.
   */
  gotAllFiles(file, callback) {
    const dirname = file.dirname;

    if (!this._required[dirname]) {
      readdir(dirname, (err, files) => {
        if (err) {
          callback(err);
        } else {
          this._files[dirname] = {};
          this._required[dirname] = files
            .filter(name => name[0] !== '.')
            .map(name => extname(name));

          this.gotAllFiles(file, callback);
        }
      });
    } else {
      this._files[dirname][file.extname] = file;

      const required = this._required[dirname];
      const files = this._files[dirname];

      if (required.filter(ext => files[ext] === undefined).length === 0) {
        callback(null, files);

        delete this._files[dirname];
      } else {
        callback(null);
      }
    }
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
   * Creates a combined file from the cached split files.
   * @param {Map<String, AtviseFile>} files The cached files stored against their extensions.
   * @param {AtviseFile} lastFile The last file collected. This is the only file guaranteed to be
   * set, therefore us if for error messages, etc.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Should be called with any errors
   * that occur while combining the files, or optionally the resulting file.
   * @abstract
   */
  createCombinedFile(files, lastFile, callback) { // eslint-disable-line no-unused-vars
    throw new Error(
      'SplittingTransformer#createCombinedFile must be implemented by all subclasses'
    );
  }

  /**
   * Calls {@link SplittingTransformer#createCombinedFile} as soon as all dependencies are
   * required files are cached.
   * @param {AtviseFile} file The read file.
   * @param {String} enc The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error occured while
   * caching files or creating the combined file or optionally the resulting combined file.
   */
  transformFromFilesystem(file, enc, callback) {
    this._combineFilesCache.gotAllFiles(file, (err, allFiles) => {
      if (err) {
        callback(err);
      } else if (allFiles) {
        this.createCombinedFile(allFiles, file, callback);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Splits a {@link vinyl~File}: The resulting is a clone of the input file, with a different path.
   * @param {vinyl~File} file The file to split.
   * @param {?String} newExtension The extension the resulting file gets.
   * @return {vinyl~File} The resulting file.
   * @example
   * // Assuming that `original` is a File with the path "path/to/file.type.xml":
   * const result = SplittingTransformer.splitFile(original, '.another');
   * // `result` is a new File, with the contents of `original` and the path
   * // "path/to/file.type/file.another"
   */
  static splitFile(file, newExtension) {
    const newFile = file.clone();

    newFile.basename = `${newFile.stem}/${newFile.stem}`;
    newFile.extname = newExtension;

    return newFile;
  }

  /**
   * Combines split files to a single one.
   * @param {vinyl~File[]} files The files to combine.
   * @param {String} newExtension The extension the resulting file gets.
   * @return {vinyl~File} The resulting file.
   */
  static combineFiles(files, newExtension) {
    const newFile = files[0].clone();

    newFile.path = `${newFile.dirname}${newExtension}`;

    return newFile;
  }

}

