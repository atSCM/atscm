import expect from 'unexpected';
import proxyquire from 'proxyquire';

describe('bin', function() {
  class StubCli {

    constructor(...args) {
      if (!StubCli.constructorCalled) {
        StubCli.constructorCalled = 0;
      }

      StubCli.constructorCalled++;
      StubCli.constructorCalledWith = args;
    }

    launch(...args) {
      if (!StubCli.launchCalled) {
        StubCli.launchCalled = 0;
      }

      StubCli.launchCalled++;
      StubCli.launchCalledWith = args;
    }

  }

  proxyquire('../../src/bin/atscm', {
    '../AtSCMCli': {
      __esModule: true,
      default: StubCli,
    },
  });

  it('should call launch', function() {
    require('../../src/bin/atscm'); // eslint-disable-line global-require

    expect(StubCli.constructorCalled, 'to equal', 1);
    expect(StubCli.constructorCalledWith, 'to equal', [process.argv.slice(2)]);
    expect(StubCli.launchCalled, 'to equal', 1);
    expect(StubCli.launchCalledWith, 'to equal', []);
  });
});
