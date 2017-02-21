'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _buffer = require('buffer');

var _through = require('through2');

var _vinyl = require('vinyl');

var _vinyl2 = _interopRequireDefault(_vinyl);

var _nodeOpcua = require('node-opcua');

var _Session = require('./Session');

var _Session2 = _interopRequireDefault(_Session);

var _NodeId = require('./NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class PullStream extends (0, _through.ctor)({ objectMode: true }) {

  browseNode(session, nodeId) {
    return new Promise((resolve, reject) => {
      session.browse({
        nodeId,
        browseDirection: _nodeOpcua.browse_service.BrowseDirection.Forward,
        nodeClassMask: 0,
        resultMask: 63
      }, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].references.filter(ref => ref.nodeId.value.toString().split(nodeId.value).length > 1).filter(ref => {
            if (ref.nodeClass.value === 2) {
              // this.push(ref.nodeId);
              this.push(new _vinyl2.default({
                path: new _NodeId2.default(ref.nodeId.toString()).filePath,
                contents: _buffer.Buffer.from('Value')
              }));
              return false;
            }

            return true;
          }).map(ref => ref.nodeId.toString()));
        }
      });
    });
  }

  browseNodes(session, nodes) {
    return Promise.all(nodes.map(node => this.browseNode(session, new _NodeId2.default(node)))).then(browse => browse.reduce((a, b) => a.concat(b)), []).then(browse => {
      if (browse.length > 0) {
        return this.browseNodes(session, browse);
      }

      return Promise.resolve();
    });
  }

  constructor(nodes = []) {
    super();

    _Session2.default.shared().then(session => this.session = session).then(session => this.browseNodes(session, nodes)).then(() => this.end()).catch(err => {
      this.emit('error', err);
      this.end();
    }).then(() => _Session2.default.close(this.session));
  }

}
exports.default = PullStream;