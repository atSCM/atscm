import expect from 'unexpected';
import TestConfig from '../../fixtures/Atviseproject.babel';
import ProjectConfig from '../../../src/config/ProjectConfig';

/** @test {ProjectConfig} */
describe('ProjectConfig', function() {
  const orgValues = {};

  function setEnv(key, value) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  afterEach(function() {
    Object.keys(orgValues).forEach(key => setEnv(key, orgValues[key]));
  });

  function checkOverride(desc, values, check) {
    const envVarNames = Object.keys(values);

    envVarNames.forEach(name => {
      if (!orgValues[name]) {
        orgValues[name] = process.env[name];
      }
    });

    it(`should ${desc}`, function() {
      envVarNames.forEach(name => setEnv(name, values[name]));

      check();
    });
  }

  function checkDefault(name, check) {
    checkOverride(
      `should use default without ${name}`,
      {
        [name]: undefined,
      },
      check
    );
  }

  checkOverride(
    'use ATSCM_PROJECT__HOST if provided',
    {
      ATSCM_PROJECT__HOST: '1.2.3.4',
    },
    function() {
      expect(ProjectConfig.host, 'to equal', '1.2.3.4');
    }
  );

  checkOverride(
    'use ATSCM_PROJECT__PORT__OPC if provided',
    {
      ATSCM_PROJECT__PORT__OPC: '1234',
    },
    function() {
      expect(ProjectConfig.port.opc, 'to equal', 1234);
    }
  );

  checkOverride(
    'use ATSCM_PROJECT__PORT__HTTP if provided',
    {
      ATSCM_PROJECT__PORT__HTTP: '1234',
    },
    function() {
      expect(ProjectConfig.port.http, 'to equal', 1234);
    }
  );

  checkOverride(
    'use ATSCM_PROJECT__LOGIN__USERNAME if provided',
    {
      ATSCM_PROJECT__LOGIN__USERNAME: 'username',
    },
    function() {
      expect(ProjectConfig.login.username, 'to equal', 'username');
    }
  );

  checkOverride(
    'use ATSCM_PROJECT__LOGIN__PASSWORD if provided',
    {
      ATSCM_PROJECT__LOGIN__PASSWORD: 'password',
    },
    function() {
      expect(ProjectConfig.login.password, 'to equal', 'password');
    }
  );

  checkDefault('ATSCM_PROJECT__HOST', () =>
    expect(ProjectConfig.host, 'to equal', TestConfig.host)
  );

  checkDefault('ATSCM_PROJECT__PORT__OPC', () =>
    expect(ProjectConfig.port.opc, 'to equal', TestConfig.port.opc)
  );

  checkDefault('ATSCM_PROJECT__PORT__HTTP', () =>
    expect(ProjectConfig.port.http, 'to equal', TestConfig.port.http)
  );

  checkDefault('ATSCM_PROJECT__LOGIN__USERNAME', () =>
    expect(ProjectConfig.login, 'to equal', TestConfig.login)
  );

  checkDefault('ATSCM_PROJECT__LOGIN__PASSWORD', () =>
    expect(ProjectConfig.login, 'to equal', TestConfig.login)
  );

  describe('.isExternal', function() {
    it('should return true for ids not included in .nodes', function() {
      expect(ProjectConfig.isExternal('Somewhere.Else'), 'to be', true);
    });

    it('should return true for ignored ids', function() {
      // NOTE: AGENT.OPCUA.server_url is ignored by .ServerRelatedNodes
      expect(ProjectConfig.isExternal('AGENT.OPCUA.server_url'), 'to be', true);
    });

    it('should return false for included nodes', function() {
      expect(ProjectConfig.isExternal('AGENT.DISPLAYS.Default'), 'to be', false);
    });
  });
});
