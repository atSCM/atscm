'use strict';

var _unexpected = require('unexpected');

var _unexpected2 = _interopRequireDefault(_unexpected);

var _nodeOpcua = require('node-opcua');

var _NodeId = require('../../../src/lib/db/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @test {NodeId} */
describe('NodeId', function () {
  const path = 'AGENT/DISPLAYS/Main';
  const id = 'AGENT.DISPLAYS.Main';

  /** @test {NodeId#constructor} */
  describe('#constructor', function () {
    it('should extend node-opcua\'s NodeId', function () {
      (0, _unexpected2.default)(new _NodeId2.default(_NodeId2.default.NodeIdType.NUMERIC, 123, 1), 'to be a', _nodeOpcua.NodeId);
    });
  });

  /** @test {NodeId#fromFilePath} */
  describe('#fromFilePath', function () {
    it('should return a NodeId', function () {
      (0, _unexpected2.default)(_NodeId2.default.fromFilePath(path), 'to be a', _NodeId2.default);
    });

    it('should return file path again', function () {
      const nodeId = _NodeId2.default.fromFilePath(path);
      (0, _unexpected2.default)(nodeId.filePath, 'to be a', 'string');
      (0, _unexpected2.default)(nodeId.filePath, 'to equal', path);
    });
  });

  /** @test {NodeId#filePath} */
  describe('#filePath', function () {
    it('should return a valid file path', function () {
      const nodeId = new _NodeId2.default(_NodeId2.default.NodeIdType.STRING, id, 1);

      (0, _unexpected2.default)(nodeId.filePath, 'to be a', 'string');
      (0, _unexpected2.default)(nodeId.filePath, 'to equal', path);
    });
  });
});