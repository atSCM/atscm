import { Stream } from 'stream';
import { Buffer } from 'buffer';
import proxyquire from 'proxyquire';
import File from 'vinyl';
import through, { ctor as throughStreamClass } from 'through2';
import expect from '../../expect';
import AtviseFile from '../../../src/lib/server/AtviseFile';

const push = proxyquire('../../../src/tasks/push', {
  gulp: {
    src: () => {
      const stream = through.obj();

      stream.push(new File({
        path: 'AGENT/OBJECTS/Variable.bool',
        contents: Buffer.from('true'),
      }));

      stream.end();

      return stream;
    },
  },
  '../lib/server/WriteStream': {
    _esModule: true,
    default: class WStream extends throughStreamClass({ objectMode: true }) {},
  },
}).default;

/** @test {push} */
describe('push', function() {
  it('should return a stream', function(done) {
    const stream = push();
    expect(stream, 'to be a', Stream);
    stream.once('end', done);
  });

  it('should stream AtviseFiles', function(done) {
    const stream = push();

    stream.on('data', data => {
      expect(data, 'to be a', AtviseFile);
    });

    stream.once('end', done);
  });
});

