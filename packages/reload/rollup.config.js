import { builtinModules } from 'module';
import resolve from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';
import addShebang from 'rollup-plugin-add-shebang';
import { dependencies } from './package.json';

const config = ({ plugins, ...rest }) => ({
  ...rest,
  plugins: [resolve(), ...plugins],
  output: {
    dir: 'out',
    format: 'cjs',
  },
});

export default [
  config({
    input: ['./src/server.ts', './src/bin.ts'],
    external: [...builtinModules, ...Object.keys(dependencies), addShebang()],
    plugins: [esbuild({ target: 'node10' })],
  }),
  config({
    input: {
      'client/client': './src/client.ts',
    },
    plugins: [esbuild()],
  }),
];
