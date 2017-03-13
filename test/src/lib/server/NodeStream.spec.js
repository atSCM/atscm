import { ClientSession, resolveNodeId } from 'node-opcua';
import { stub, spy } from 'sinon';
import expect from '../../../expect';
import NodeStream from '../../../../src/lib/server/NodeStream';
import Stream from '../../../../src/lib/server/Stream';
import Session from '../../../../src/lib/server/Session';
import NodeId from '../../../../src/lib/server/NodeId';

/** @test {NodeStream} */
describe('NodeStream', function() {
  const testNodes = [new NodeId('ns=1;s=AGENT.DISPLAYS')];

  /** @test {NodeStream#constructor} */
  describe('#constructor', function() {
    let stream;

    it('should fail without nodes', function() {
      expect(() => (stream = new NodeStream()), 'to throw', 'nodes is required');
    });

    it('should return a server Stream', function() {
      expect((stream = new NodeStream(testNodes)), 'to be a', Stream);
    });

    it('should store "maxRetries" option', function() {
      expect((stream = new NodeStream(testNodes, { maxRetries: 13 })).maxRetries, 'to equal', 13);
    });

    it('should set "recursive" to true by default', function() {
      expect((stream = new NodeStream(testNodes)).recursive, 'to be true');
    });

    it('should handle "recursive" option', function() {
      expect((stream = new NodeStream(testNodes, { recursive: false })).recursive, 'to be false');
    });

    it('should throw if options.ignoreNodes is not an array', function() {
      expect(() => (stream = new NodeStream(testNodes, { ignoreNodes: 'asdf' })), 'to throw',
        'ignoreNodes must be an array of node ids');
    });

    it('should handle "ignoreNodes" option', function() {
      expect((stream = new NodeStream(testNodes, { ignoreNodes: [new NodeId('TESTNODE')] }))
        .ignoredRegExp, 'to equal', new RegExp('^(ns=1;s=TESTNODE)'));
    });
  });

  /** @test {NodeStream#browseNodes} */
  describe('#browseNodes', function() {
    it('should be called for the specified nodes', function(done) {
      const stream = new NodeStream(testNodes);
      stub(stream, 'browseNodes', () => Promise.resolve(true));

      stream.on('data', () => {}) // unpause readable stream
        .on('end', () => {
          expect(stream.browseNodes.calledOnce, 'to be', true);
          expect(stream.browseNodes.lastCall.args, 'to equal', [testNodes]);

          done();
        });
    });

    context('when browsing fails', function() {
      before(() => {
        stub(ClientSession.prototype, 'browse', (node, cb) => {
          cb(new Error('Browse error'));
        });
      });

      after(() => ClientSession.prototype.browse.restore());

      it('should forward errors', function(done) {
        const stream = new NodeStream(testNodes);
        stream.once('session-open', () => {
          Session.close(stream.session);
        });

        stream.on('data', () => {}) // unpause readable stream
          .on('error', err => {
            expect(err, 'to have message', /Browse error/);

            done();
          });
      });
    });

    context('when browsing returns empty results', function() {
      before(() => {
        stub(ClientSession.prototype, 'browse', (node, cb) => {
          cb(null, []);
        });
      });

      after(() => ClientSession.prototype.browse.restore());

      it('should emit error', function(done) {
        const stream = new NodeStream(testNodes);
        stream.once('session-open', () => {
          Session.close(stream.session);
        });

        stream.on('data', () => {}) // unpause readable stream
          .on('error', err => {
            expect(err, 'to have message', /No results/);

            done();
          });
      });
    });

    context('when browsing returns status codes > 0', function() {
      before(() => {
        stub(ClientSession.prototype, 'browse', (node, cb) => {
          cb(null, [{ statusCode: 13 }]);
        });
      });

      after(() => ClientSession.prototype.browse.restore());

      it('should emit error', function(done) {
        const stream = new NodeStream(testNodes);

        stream.on('data', () => {}) // unpause readable stream
          .on('error', err => {
            expect(err, 'to have message', /failed: Code 13/);

            done();
          });
      });
    });

    context('when browsing works', function() {
      const nodeId = resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main');
      let firstCall = true;

      before(() => {
        stub(ClientSession.prototype, 'browse', (node, cb) => {
          if (firstCall) {
            cb(null, [{
              references: [{ nodeClass: { value: 2 }, nodeId }],
            }]);
            firstCall = false;
          } else {
            cb(null, [{ references: [] }]);
          }
        });
      });

      after(() => ClientSession.prototype.browse.restore());

      beforeEach(() => (firstCall = true));

      it('should push browsed variable nodes', function(done) {
        const stream = new NodeStream(testNodes);

        stream.on('data', desc => {
          expect(desc.nodeId, 'to equal', nodeId);
        })
          .on('end', () => done());
      });

      it('should be called only once when recursive is set to false', function(done) {
        const stream = new NodeStream(testNodes, { recursive: false });
        spy(stream, 'browseNode');

        stream
          .on('data', () => {}) // unpause readable stream
          .on('end', () => {
            expect(stream.browseNode, 'was called times', 1);
            expect(stream.browseNode, 'was called with', testNodes[0]);

            done();
          });
      });

      it('should be called for all browsed nodes if recursive is set', function(done) {
        const stream = new NodeStream(testNodes, { recursive: true });
        spy(stream, 'browseNode');
        const nodes = [];

        stream
          .on('data', desc => nodes.push(desc.nodeId)) // unpause readable stream
          .on('end', () => {
            expect(stream.browseNode.callCount, 'to be greater than', 1);
            expect(stream.browseNode, 'to have calls satisfying',
              testNodes.concat(nodes).map(n => ({ args: [n] }))
            );

            done();
          });
      });
    });
  });
});
