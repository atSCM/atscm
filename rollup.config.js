import builtinModules from 'builtin-modules';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import { dependencies } from './package.json';

export default {
  input: [
    './src/api.js',
    './src/Gulpfile.js',
    './src/index.js',
  ],
  output: {
    format: 'cjs',
    dir: 'out',
    sourcemap: true,
  },
  external: id => Object.keys(dependencies)
    .concat(builtinModules)
    .find(dep => id.startsWith(dep)),
  plugins: [
    resolve(),
    json(),
    babel({
      exclude: 'node_modules/**',
    }),
  ],
};
