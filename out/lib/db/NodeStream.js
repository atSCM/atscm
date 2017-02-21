'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _Stream = require('./Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _NodeId = require('./NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class NodeStream extends _Stream2.default {

  constructor(nodes) {
    if (!nodes || !(nodes instanceof Array)) {
      throw new Error('nodes required');
    }

    super(nodes);

    this.found = 0;

    this._resultMask = _nodeOpcua.browse_service.makeResultMask('ReferenceType | NodeClass | TypeDefinition');
  }

  browseNode(session, nodeId) {
    return new Promise((resolve, reject) => {
      session.browse({
        nodeId,
        browseDirection: _nodeOpcua.browse_service.BrowseDirection.Forward,
        includeSubtypes: true,
        resultMask: this._resultMask
      }, (err, results) => {
        if (err) {
          reject(new Error(`Error while browsing ${nodeId.toString()}: ${err.message}`));
        } else {
          if (!results || results.length === 0) {
            reject(new Error(`No results when browsing ${nodeId.toString()}`));
          } else if (results[0].statusCode > 0) {
            reject(new Error(`Returned status code ${results.statusCode} when browsing ${nodeId.toString()}`));
          } else {
            resolve(results[0].references
            // Remove parent nodes
            .filter(ref => ref.nodeId.value.toString().split(nodeId.value).length > 1)
            // Remove variable nodes
            .map(ref => {
              // Push all variable ids
              if (ref.nodeClass.value === 2) {
                this.push(new _NodeId2.default(ref.nodeId.toString()));
                this.found++;
              }

              return ref.nodeId;
            })
            // .map(ref => ref.nodeId)
            /* .reduce((result, ref) => {
             const id = new NodeId(ref.nodeId.toString());
              if (ref.nodeClass.value === 2) {
             result.variables.push(id);
             } else {
             result.objects.push(id);
             }
              return result;
             }, { variables: [], objects: [] }) */
            );
          }
        }
      });
    })
    // TODO: Make optional, e.g. with "recursive" set to true
    .then(childObjectNodes => this.browseNodes(session, childObjectNodes));
  }

  browseNodes(session, nodeIds) {
    return Promise.all(nodeIds.map(nodeId => this.browseNode(session, nodeId)));
  }

  runWithSession(session, nodesToBrowse) {
    return this.browseNodes(session, nodesToBrowse.map(_nodeOpcua.resolveNodeId)).then(() => this.end());
  }

}
exports.default = NodeStream;