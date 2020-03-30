import { join } from 'path';
import expect from 'unexpected';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';

const gulpCli = spy();
const RunCommand = proxyquire('../../src/cli/commands/Run', {
  'gulp-cli/lib/versioned/^4.0.0/': gulpCli,
}).default;

describe('Issue #62', function () {
  it('should not throw on missing task', function () {
    const command = new RunCommand('run', 'Run tasks.');

    command.run({
      environment: {
        cwd: __dirname,
        modulePath: join(__dirname, 'out/index.js'),
      },
      options: {
        T: true,
      },
    });

    return expect(gulpCli.lastCall.args[0]._, 'to be defined');
  });
});
