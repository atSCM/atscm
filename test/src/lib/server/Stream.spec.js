import expect from 'unexpected';
import proxyquire from 'proxyquire';
import { spy } from 'sinon';

import { Stream as CoreStream } from 'stream';
import { ClientSession } from 'node-opcua';
import Stream from '../../../../src/lib/server/Stream';
import Session from '../../../../src/lib/server/Session';

/** @test {Stream} */
describe('Stream', function() {
  this.timeout(5000);

  /** @test {Stream#constructor} */
  describe('#constructor', function() {
    it('should return a stream', function() {
      expect(new Stream(), 'to be a', CoreStream);
    });

    it('should emit "session-open" once session is open', function(done) {
      const stream = new Stream();

      stream.on('session-open', session => {
        expect(stream.session, 'to be defined');
        expect(stream.session, 'to be a', ClientSession);
        expect(session, 'to be', stream.session);

        done();
      });
    });

    it('should forward session connect errors', function(done) {
      const FailingStream = proxyquire('../../../../src/lib/server/Stream', {
        './Session': {
          _esModule: true,
          default: class FailingSession {
            static create() {
              return Promise.reject(new Error('Failed'));
            }
          },
        },
      }).default;

      (new FailingStream())
        .on('error', err => {
          expect(err, 'to have message', 'Failed');
          done();
        });
    });

    it('should close session and disconnect client on end', function(done) {
      const stream = new Stream();

      stream
        .once('session-open', () => {
          spy(stream.session, 'close');
          spy(stream.session._client, 'disconnect');

          stream.end();
        })
        .on('end', () => {
          expect(stream.session.close.calledOnce, 'to be', true);
          expect(stream.session._client.disconnect.calledOnce, 'to be', true);
          done();
        })
        .on('data', () => {}); // unpause readable stream
    });

    it('should be endable even if session was not opened yet', function(done) {
      const stream = new Stream();
      const listener = spy();

      stream.on('error', listener)
        .on('end', () => {
          expect(listener.callCount, 'to equal', 0);
          done();
        })
        .on('data', () => {}); // unpause readable stream

      stream.end();
    });

    it('should forward errors occurring while closing session', function(done) {
      const FailingStream = proxyquire('../../../../src/lib/server/Stream', {
        './Session': {
          _esModule: true,
          default: class FailingStream extends Session {

            static close() {
              return Promise.reject(new Error('Failed'));
            }

          },
        },
      }).default;

      const stream = (new FailingStream())
        .on('error', err => {
          expect(err, 'to have message', 'Failed');
          done();
        })
        .on('data', () => {}) // unpause readable stream
        .once('session-open', () => stream.end());
    });
  });
});
