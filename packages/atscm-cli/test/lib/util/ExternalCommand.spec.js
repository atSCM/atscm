import Emitter from 'events';
import { Buffer } from 'buffer';
import { stub, spy } from 'sinon';
import proxyquire from 'proxyquire';
import expect from 'unexpected';

const which = stub().callsArgWith(1, null, 'bin');
const stubProcess = Object.assign(new Emitter(), {
  stdout: new Emitter(),
  stderr: new Emitter(),
});
const spawn = stub().returns(stubProcess);

const External = proxyquire('../../../src/lib/util/ExternalCommand', {
  which,
  child_process: {
    spawn,
  },
}).default;

/** @test {ExternalCommand} */
describe('External', function() {
  beforeEach(function() {
    which.resetHistory();
    which.callsArgWith(1, null, 'bin');
  });

  /** @test {ExternalCommand#resolveBin} */
  describe('#resolveBin', function() {
    it('should be fulfilled with which results', function() {
      which.callsArgWith(1, null, 'bin');

      return expect(External.resolveBin('asdf'), 'to be fulfilled with', 'bin').then(() => {
        expect(which.calledOnce, 'to be', true);
        expect(which.lastCall.args[0], 'to equal', 'asdf');
      });
    });

    it('should reject on which error', function() {
      which.callsArgWith(1, new Error('which error'));

      return expect(External.resolveBin('asdf'), 'to be rejected with', 'which error').then(() => {
        expect(which.calledOnce, 'to be', true);
        expect(which.lastCall.args[0], 'to equal', 'asdf');
      });
    });
  });

  /** @test {ExternalCommand#spawn} */
  describe('#spawn', function() {
    it('should be rejected on spawn error', function() {
      const p = expect(External.spawn('asdf'), 'to be rejected with', 'spawn error');

      stubProcess.emit('error', new Error('spawn error'));

      return p;
    });

    it('should be rejected on non-zero exit code', function() {
      const p = expect(External.spawn('asdf'), 'to be rejected with', /returned code 123$/);

      stubProcess.emit('close', 123);

      return p;
    });

    it('should be fulfill with trimmed stdout data', function() {
      const p = expect(External.spawn('asdf'), 'to be fulfilled with', 'data');

      stubProcess.stdout.emit('data', Buffer.from('data\n'));
      stubProcess.emit('close', 0);

      return p;
    });

    it('should pass args to spawn', function() {
      const args = ['--test'];
      const p = expect(External.spawn('asdf', args), 'to be fulfilled').then(() =>
        expect(spawn.calledWith('asdf', args), 'to be true')
      );

      stubProcess.emit('close', 0);

      return p;
    });

    it('should pass options.spawn to spawn', function() {
      const spawnOpts = { opt: 13 };
      const p = expect(
        External.spawn('asdf', [], { spawn: spawnOpts }),
        'to be fulfilled'
      ).then(() => expect(spawn.calledWith('asdf', [], spawnOpts), 'to be true'));

      stubProcess.emit('close', 0);

      return p;
    });

    it('should call options.onspawn after spawn', function() {
      const onspawn = spy();
      const p = expect(External.spawn('asdf', [], { onspawn }), 'to be fulfilled')
        .then(() => expect(onspawn.calledOnce, 'to be true'))
        .then(() => expect(onspawn.lastCall.args[0], 'to be', stubProcess));

      stubProcess.emit('close', 0);

      return p;
    });
  });

  /** @test {ExternalCommand#run} */
  describe('#run', function() {
    it('should call #resolveBin with name', function() {
      return expect(
        External.run('asdf', [], {
          onspawn() {
            stubProcess.emit('close', 0);
          },
        }),
        'to be fulfilled'
      )
        .then(() => expect(which.calledOnce, 'to be true'))
        .then(() => expect(which.lastCall.args[0], 'to equal', 'asdf'));
    });

    it('should call #spawn with which results and other args', function() {
      return expect(
        External.run('asdf', [], {
          onspawn() {
            stubProcess.emit('close', 0);
          },
        }),
        'to be fulfilled'
      )
        .then(() => expect(which.calledOnce, 'to be true'))
        .then(() => expect(which.lastCall.args[0], 'to equal', 'asdf'));
    });
  });
});
