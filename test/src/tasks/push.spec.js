import proxyquire from 'proxyquire';
import expect from '../../expect';

const push = proxyquire('../../../src/tasks/push', {
  '../api': {
    _esModule: true,
    async readNode() {
      throw new Error('Test');
    },
  },
}).default;

/** @test {push} */
describe('push', function() {
  it('should return a promise', function() {
    const promise = push();
    expect(promise, 'to be a', Promise);

    return promise
      .catch(err => {
        if (err.message === 'Test') { return; }

        throw err;
      });
  });
});

