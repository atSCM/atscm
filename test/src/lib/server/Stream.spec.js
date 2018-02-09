import { Stream as CoreStream } from 'stream';
import proxyquire from 'proxyquire';
import { spy } from 'sinon';
import { ClientSession } from 'node-opcua';
import expect from '../../../expect';
import Stream from '../../../../src/lib/stream/Stream';
import Session from '../../../../src/lib/ua/Session';

/** @test {Stream} */
describe('Stream', function() {
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

    it('should close session on end', function() {
      const stream = new Stream();

      stream.once('session-open', () => {
        spy(Session, 'close');

        stream.end();
      });

      return expect(stream, 'to yield objects satisfying', 'to have length', 0)
        .then(() => {
          expect(Session.close, 'was called once');
        });
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
