import { join } from 'path';
import expect from 'unexpected';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';

const gulpCli = spy();
const RunCommand = proxyquire('../../../src/cli/commands/Run', {
  'gulp-cli/lib/versioned/^4.0.0/': gulpCli,
}).default;

/** @test {RunCommand} */
describe('RunCommand', function () {
  const command = new RunCommand('run', 'Run tasks.');

  /** @test {RunCommand#run} */
  describe('#run', function () {
    const cli = {
      environment: {
        cwd: __dirname,
        modulePath: join(__dirname, 'out/index.js'),
      },
      options: {
        task: ['task1', 'task2'],
        T: 'tasks',
        tasksJson: 'tasks-json',
        tasksSimple: 'tasks-simple',
        continue: 'continue',
      },
    };

    afterEach(() => {
      gulpCli.resetHistory();
    });

    it('should run gulp-cli', function () {
      command.run(cli);

      expect(gulpCli.calledOnce, 'to be', true);
      expect(gulpCli.lastCall.args, 'to contain', {
        _: ['task1', 'task2'],
        tasks: 'tasks',
        tasksSimple: 'tasks-simple',
        tasksJson: 'tasks-json',
        continue: 'continue',
      });

      expect(gulpCli.lastCall.args, 'to contain', {
        configPath: join(__dirname, 'out/Gulpfile.js'),
        modulePath: join(__dirname, 'node_modules/gulp'),
      });
    });
  });
});
