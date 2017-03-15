import expect from 'unexpected';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import { join } from 'path';

const openSpy = spy();
const DocsCommand = proxyquire('../../../src/cli/commands/Docs', {
  open: openSpy,
}).default;

/** @test {DocsCommand} */
describe('DocsCommand', function() {
  const command = new DocsCommand('docs', 'Open documentation.');

  /** @test {DocsCommand#pathToOpen} */
  describe('#pathToOpen', function() {
    it('should be local api docs by default', function() {
      expect(
        command.pathToOpen({
          options: {},
          environment: {
            modulePath: '/path/to/package.json',
          },
        }),
        'to equal', join('/path/docs/api/index.html')
      );
    });

    it('should be cli api docs with --cli option', function() {
      expect(
        command.pathToOpen({
          options: { cli: true },
        }),
        'to equal', join(__dirname, '../../../docs/api/index.html')
      );
    });
  });

  /** @test {DocsCommand#run} */
  describe('#run', function() {
    beforeEach(() => openSpy.reset());

    it('should open local api docs by default', function() {
      command.run({
        options: {},
        environment: {
          modulePath: '/path/to/package.json',
        },
      });

      expect(openSpy.calledOnce, 'to be', true);
      expect(openSpy.lastCall.args[0], 'to equal', join('/path/docs/api/index.html'));
      expect(openSpy.lastCall.args[1], 'to be undefined');
    });

    it('should open cli api docs with --cli option', function() {
      command.run({
        options: {
          cli: true,
        },
      });

      expect(openSpy.calledOnce, 'to be', true);
      expect(openSpy.lastCall.args[0], 'to equal', join(__dirname, '../../../docs/api/index.html'));
      expect(openSpy.lastCall.args[1], 'to be undefined');
    });

    it('should open in specific browser with --browser option', function() {
      command.run({
        options: {
          cli: false,
          browser: 'custombrowser',
        },
        environment: {
          modulePath: '/path/to/package.json',
        },
      });

      expect(openSpy.calledOnce, 'to be', true);
      expect(openSpy.lastCall.args[0], 'to equal', join('/path/docs/api/index.html'));
      expect(openSpy.lastCall.args[1], 'to equal', 'custombrowser');
    });
  });

  /** @test {DocsCommand#requiresEnvironment} */
  describe('#requiresEnvironment', function() {
    it('should return false if `--cli` is used', function() {
      expect(command.requiresEnvironment({ options: { cli: true } }), 'to be', false);
    });
  });
});
