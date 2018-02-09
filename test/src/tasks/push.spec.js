import { Stream } from 'stream';
import { Buffer } from 'buffer';
import proxyquire from 'proxyquire';
import File from 'vinyl';
import through from 'through2';
import expect from '../../expect';

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
  '../lib/gulp/PushStream': {
    _esModule: true,
    default: class WStream {

      constructor(srcStream) {
        return srcStream;
      }

    },
  },
}).default;

/** @test {push} */
describe('push', function() {
  it('should return a stream', function(done) {
    const stream = push();
    expect(stream, 'to be a', Stream);

    stream.on('data', () => {}); // Unpipe readable stream
    stream.once('end', done);
  });
});

