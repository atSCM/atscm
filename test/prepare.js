import { join } from 'path';

function setEnvVarIfNeeded(name, value) {
  const key = `ATSCM_PROJECT__${name}`;

  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

process.env.ATSCM_CONFIG_PATH = join(__dirname, './../src/lib/config/Atviseproject.js');

setEnvVarIfNeeded('HOST', '185.67.228.66');
setEnvVarIfNeeded('PORT_OPC', '4888');
setEnvVarIfNeeded('PORT_HTTP', '8888');
setEnvVarIfNeeded('LOGIN__USERNAME', process.env.ATVISE_USERNAME);
setEnvVarIfNeeded('LOGIN__PASSWORD', process.env.ATVISE_PASSWORD);
