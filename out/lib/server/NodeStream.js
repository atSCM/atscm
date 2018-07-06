'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _browse_service = require('node-opcua/lib/services/browse_service');

var _browse_service2 = _interopRequireDefault(_browse_service);

var _nodeclass = require('node-opcua/lib/datamodel/nodeclass');

var _opcua_node_ids = require('node-opcua/lib/opcua_node_ids');

var _read_service = require('node-opcua/lib/services/read_service');

var _opcua_status_code = require('node-opcua/lib/datamodel/opcua_status_code');

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _ProjectConfig = require('../../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

var _NodeId = require('../model/opcua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

var _ReverseReferenceTypeIds = require('../model/opcua/ReverseReferenceTypeIds');

var _ReverseReferenceTypeIds2 = _interopRequireDefault(_ReverseReferenceTypeIds);

var _QueueStream = require('./QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * List of reference types that should be browsed.
 * @see https://github.com/node-opcua/node-opcua/blob/608771099fbfaa42195e150bdf36956affbb53e9/packages/node-opcua-constants/src/opcua_node_ids.js
 * @type {node-opcua~ReferenceTypeId[]}
 */
/* Needed as long as https://github.com/gajus/eslint-plugin-jsdoc/issues/56 is open */
/* eslint-disable jsdoc/check-param-names */

const BrowseReferenceTypes = [_opcua_node_ids.ReferenceTypeIds.HasComponent, _opcua_node_ids.ReferenceTypeIds.HasProperty, _opcua_node_ids.ReferenceTypeIds.HasSubtype, _opcua_node_ids.ReferenceTypeIds.HasEventSource, _opcua_node_ids.ReferenceTypeIds.HasNotifier];

/**
 * List of reference types that are used for node metadata.
 * @type {node-opcua~ReferenceTypeId[]}
 * @see https://github.com/node-opcua/node-opcua/blob/608771099fbfaa42195e150bdf36956affbb53e9/packages/node-opcua-constants/src/opcua_node_ids.js
 */
const AtviseReferenceTypes = [_opcua_node_ids.ReferenceTypeIds.HasEventSource, _opcua_node_ids.ReferenceTypeIds.HasNotifier, _opcua_node_ids.ReferenceTypeIds.HasHistoricalConfiguration];

/**
 * List of reference types that are used for node metadata.
 * @type {node-opcua~ReferenceTypeId[]}
 * @see https://github.com/node-opcua/node-opcua/blob/608771099fbfaa42195e150bdf36956affbb53e9/packages/node-opcua-constants/src/opcua_node_ids.js
 */
const TypeDefinitionReferenceTypes = [_opcua_node_ids.ReferenceTypeIds.HasTypeDefinition, _opcua_node_ids.ReferenceTypeIds.HasModellingRule];

/**
 * List of reference types that are used for node metadata.
 * @type {node-opcua~ReferenceTypeId[]}
 * @see https://github.com/node-opcua/node-opcua/blob/608771099fbfaa42195e150bdf36956affbb53e9/packages/node-opcua-constants/src/opcua_node_ids.js
 */
const InverseReferenceTypes = [_opcua_node_ids.ReferenceTypeIds.Organizes];

/**
 * List of valid reference types
 * @type {Set<node-opcua~ReferenceTypeId>}
 * @see https://github.com/node-opcua/node-opcua/blob/608771099fbfaa42195e150bdf36956affbb53e9/packages/node-opcua-constants/src/opcua_node_ids.js
 */
const ValidReferenceTypes = new Set([...BrowseReferenceTypes, ...AtviseReferenceTypes, ...TypeDefinitionReferenceTypes, ...InverseReferenceTypes]);

/**
 * A stream that browses the nodes specified and (if *recursive* option is set) it's child nodes.
 * Pushes {@link NodeStream.BrowseResult}s to piped streams.
 */
class NodeStream extends _QueueStream2.default {

  /**
   * Creates a new NodeStream based on the nodes to start browsing with and some options.
   * @param {NodeId[]} nodesToBrowse The nodes to start browsing with.
   * @param {Object} [options] The options to use.
   * @param {boolean} [options.recursive=true] If the discovered nodes should be browsed as well.
   * @param {NodeId[]} [options.ignoreNodes=ProjectConfig.ignoreNodes] An array of {@link NodeId}s
   * to ignore.
   */
  constructor(nodesToBrowse, options = {}) {
    if (!nodesToBrowse || !(nodesToBrowse instanceof Array) || nodesToBrowse.length === 0) {
      throw new Error('nodesToBrowse is required');
    }

    if (options && options.ignoreNodes && !(options.ignoreNodes instanceof Array)) {
      throw new Error('ignoreNodes must be an array of node ids');
    }

    super(options);

    // Handle options
    /**
     * If the discovered nodes should be browsed as well.
     * @type {Boolean}
     */
    this.recursive = true;
    if (options.recursive !== undefined) {
      this.recursive = options.recursive;
    }

    let ignoreNodes = _ProjectConfig2.default.ignoreNodes;
    if (options.ignoreNodes !== undefined) {
      ignoreNodes = options.ignoreNodes;
    }

    /**
     * The result mask to use.
     * @type {UInt32}
     */
    this._resultMask = _browse_service2.default.makeResultMask('ReferenceType | NodeClass | TypeDefinition');

    /**
     * A regular expression matching all node ids specified in {@link NodeStream#ignoreNodes}
     * @type {RegExp}
     */
    this.ignoredRegExp = new RegExp(`^(${ignoreNodes.map(n => n.toString()).join('|')})`);

    const nodes = nodesToBrowse.filter(nodeId => {
      const ignored = this.isIgnored({ nodeId });

      if (ignored) {
        _gulplog2.default.warn(`${nodeId} is set to be browsed, but ignored.`);
        _gulplog2.default.info(` - Remove ${nodeId} from Atviseproject#nodes if this is intentionally.`);
      }

      return !ignored;
    });

    if (!nodes.length) {
      throw new Error('Nothing to browse');
    }

    // Write nodes to read
    this.once('session-open', () => {
      this._writeNodesToBrowse(nodes);
    });
  }

  /**
   * Once the stream's session is open it reads the {@link node-opcua~NodeClass}es of
   * *nodesToBrowse* (passed to the constructor) from atvise server. After that it writes the
   * read results to itself and starts browsing.
   * @param {NodeId[]} nodes The nodes passed to the constructor.
   */
  _writeNodesToBrowse(nodes) {
    function checkResultsStatus(results) {
      if (!results || !results.length) {
        throw new Error('No results');
      }

      const failing = results.reduce((f, { statusCode }, i) => {
        if (statusCode !== _opcua_status_code.StatusCodes.Good) {
          return f.concat(nodes[i]);
        }

        return f;
      }, []);

      if (failing.length) {
        const info = failing.join(', ');

        throw new Error(`Error reading ${info}`);
      }
    }

    const getParentRefs = async () => {
      const results = await new Promise((resolve, reject) => {
        this.session.browse(nodes.map(nodeId => ({
          nodeId,
          browseDirection: _browse_service2.default.BrowseDirection.Inverse,
          includeSubtypes: true,
          resultMask: this._resultMask
        })), (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });

      checkResultsStatus(results);

      return results.map(({ references }) => ({
        toParent: _ReverseReferenceTypeIds2.default[references.map(reference => reference.referenceTypeId.value).find(value => BrowseReferenceTypes.includes(value))]
      }));
    };

    const getNodeClasses = async () => {
      const results = await new Promise((resolve, reject) => {
        this.session.read(nodes.map(nodeId => ({
          nodeId,
          attributeId: _read_service.AttributeIds.NodeClass
        })), (err, _, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });

      checkResultsStatus(results);

      return results.map(({ value }) => ({
        nodeClass: _nodeclass.NodeClass[value.value]
      }));
    };

    Promise.all([getParentRefs(), getNodeClasses()]).then(([parents, classes]) => {
      nodes.forEach((nodeId, i) => {
        this.write(Object.assign({ nodeId }, parents[i], classes[i]));
      });

      // End once drained
      this.once('drained', () => {
        _gulplog2.default.debug(`Discovered ${this._processed} nodes`);
        this.end();
      });

      this.emit('initial-read-complete', {});
    }).catch(err => this.emit('error', err));
  }

  /**
   * Returns an error message specifically for the given nodeId.
   * @param {Object} chunk The chunk to get the error message for.
   * @param {NodeId} chunk.nodeId The browsed nodeId.
   * @return {string} The specific error message.
   */
  processErrorMessage({ nodeId }) {
    return `Error browsing ${nodeId.toString()}`;
  }

  /**
   * Checks if the given reference is a valid browse stream reference or not.
   * @param {node-opcua~ReferenceDescription} ref The reference description to check.
   * @return {boolean} reference is valid(=true) or not(=false)
   */
  isValidReference(ref) {
    return ValidReferenceTypes.has(ref.referenceTypeId.value);
  }

  /**
   * Checks if the given reference description is ignored.
   * @param {node-opcua~ReferenceDescription} ref The reference description to check.
   * @return {boolean} The given reference description should be ignored(=true) or not(=false)
   */
  isIgnored(ref) {
    const refNodeId = ref.nodeId.toString();

    if (refNodeId.match(this.ignoredRegExp)) {
      _gulplog2.default.debug(`Ignored node: ${refNodeId}`);
      return true;
    }

    return false;
  }

  /**
   * Checks if the given reference matches the defined browse Filters.
   * @param {node-opcua~ReferenceDescription} ref The reference description to check.
   * @return {boolean} reference matches browse filters(=true) or not(=false)
   */
  shouldBeProcessed(ref) {
    return this.isValidReference(ref) && !this.isIgnored(ref);
  }

  /**
   * Checks if the given reference should be pushed to NodeStream input or not.
   * @param {node-opcua~ReferenceDescription} ref The reference description to check.
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   * @return {boolean} reference should be pushed(=true) or not(=false)
   */
  shouldBeBrowsed(ref, nodeId) {
    return BrowseReferenceTypes.includes(ref.referenceTypeId.value) && ref.nodeId.isChildOf(nodeId);
  }

  /**
   * Handles a browse result of a single node. All child references are written to the stream, other
   * references and the browsed node itself are pusched to piped streams.
   * @param {Object} browsedNode The id and class of the currently browsed node.
   * @param {Object} result The result of the browsing the node.
   * @param  {function(err: Error)} done Called once the node has been processed.
   */
  handleResult({ nodeId, nodeClass, toParent, parent }, result, done) {
    const nodesToBrowse = [];

    const references = { toParent };

    Promise.all(result.references
    // Ignore specified nodes
    .filter(this.shouldBeProcessed.bind(this))
    // Push variable nodes, recurse
    .map(ref => {
      let promise = Promise.resolve();

      // "Cast" ref.nodeId to NodeId
      Object.setPrototypeOf(ref.nodeId, _NodeId2.default.prototype);

      let addToReferences = true;

      if (this.recursive && this.shouldBeBrowsed(ref, nodeId) && !nodesToBrowse.includes(ref.nodeId.toString())) {
        nodesToBrowse.push(ref.nodeId.toString());
        addToReferences = false;

        promise = new Promise(resolve => {
          this.write({
            nodeId: ref.nodeId,
            nodeClass: ref.$nodeClass,
            toParent: _ReverseReferenceTypeIds2.default[ref.referenceTypeId.value],
            parent: nodeId
          }, null, resolve);
        });
      }

      if (addToReferences) {
        const referenceType = _ReverseReferenceTypeIds2.default[ref.referenceTypeId.value];

        if (!references[referenceType]) {
          references[referenceType] = [];
        }

        references[referenceType].push(ref.nodeId);
      }

      return promise;
    })).then(() => {
      this.push({ nodeClass, nodeId, references, parent });

      done();
    }).catch(done);
  }

  /**
   * Returns a {ReadStream.ReadResult} for the given reference description.
   * @param {NodeId} nodeId The node id to browse.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk({ nodeId, nodeClass, toParent, parent }, handleErrors) {
    this.session.browse({
      nodeId,
      browseDirection: _browse_service2.default.BrowseDirection.Forward,
      includeSubtypes: true,
      resultMask: this._resultMask
    }, (err, results) => {
      if (!err && (!results || results.length === 0)) {
        handleErrors(new Error('No results'));
      } else {
        handleErrors(err, results && results.length > 0 ? results[0].statusCode : null, done => {
          this.handleResult({ nodeId, nodeClass, toParent, parent }, results[0], done);
        });
      }
    });
  }

}
exports.default = NodeStream;
//# sourceMappingURL=NodeStream.js.map