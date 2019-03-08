import builtinModules from 'builtin-modules';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import { dependencies } from './package.json';

function external(id) {
  return Object.keys(dependencies)
    .concat(builtinModules)
    .find(dep => id.startsWith(dep));
}

export default [{
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
  external,
  plugins: [
    resolve(),
    unusedPlugin(({
      include: 'src/**',
      exclude: [
        'src/init/**',
        'src/typedef/**',
      ],
    })),
    json(),
    babel({
      exclude: 'node_modules/**',
    }),
  ],
},
{
  input: [
    './src/init/init.js',
    './src/init/Options.js',
  ],
  output: {
    format: 'cjs',
    dir: 'out/init',
    sourcemap: true,
  },
  external,
  plugins: [
    resolve(),
    json(),
    babel({
      exclude: 'node_modules/**',
    }),
  ],
}];
