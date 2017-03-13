<a name="0.2.1"></a>
## [0.2.1](https://github.com/atSCM/atscm/compare/0.2.0-alpha.1...v0.2.1) (2017-03-13)


### Bug Fixes

* **AtviseFile:** Ignore leading and trailing whitespaces and newlines when encoding ([269564a](https://github.com/atSCM/atscm/commit/269564a)), closes [#21](https://github.com/atSCM/atscm/issues/21)
* **mapping:** Encode/decode UInt64 ([0eef39e](https://github.com/atSCM/atscm/commit/0eef39e)), closes [#26](https://github.com/atSCM/atscm/issues/26)
* **mapping:** Fix invalid rc path for array varaiables ([7cda5bb](https://github.com/atSCM/atscm/commit/7cda5bb)), closes [#25](https://github.com/atSCM/atscm/issues/25)
* **NodeStream:** Use "maxRetries" option ([42aae0d](https://github.com/atSCM/atscm/commit/42aae0d))
* **push:** Prevent memory leak inside `glob-stream` ([c487a6f](https://github.com/atSCM/atscm/commit/c487a6f))
* **ScriptTransformer:** Handle invalid results ([b80be42](https://github.com/atSCM/atscm/commit/b80be42))
* **ScriptTransformer:** Warn on empty document ([a0b88df](https://github.com/atSCM/atscm/commit/a0b88df)), closes [#24](https://github.com/atSCM/atscm/issues/24)
* **server~Client:** Reject with Error ([79a3355](https://github.com/atSCM/atscm/commit/79a3355))
* **server~Watcher:** Emit browse and subscribe errors ([9b27533](https://github.com/atSCM/atscm/commit/9b27533))
* **Session:** Resolve with closing session ([7677aba](https://github.com/atSCM/atscm/commit/7677aba))
* **Syntax:** Fix typo ([fd6cfc1](https://github.com/atSCM/atscm/commit/fd6cfc1))
* **tasks:** Prevent node-opcua from logging to console ([#27](https://github.com/atSCM/atscm/issues/27)) ([e6c892d](https://github.com/atSCM/atscm/commit/e6c892d))
* **test:** Prevent opening to many sessions while testing ([afd3300](https://github.com/atSCM/atscm/commit/afd3300))
* **test:** Support empty mtime field ([03909e1](https://github.com/atSCM/atscm/commit/03909e1))
* **Transformer:** Fixes an issue where Transformer#constructor throws with options not containing direction ([022a9bd](https://github.com/atSCM/atscm/commit/022a9bd))
* **transformers:** Fixes an issue where Transformer#applyTransformers does not run all transformers ([97c042f](https://github.com/atSCM/atscm/commit/97c042f))
* **watch:** Ignore value changes of nodes that were just pushed ([7ccc546](https://github.com/atSCM/atscm/commit/7ccc546)), closes [#20](https://github.com/atSCM/atscm/issues/20)
* **Watcher:** Better error handling ([32b6e6c](https://github.com/atSCM/atscm/commit/32b6e6c))
* **Watcher:** Emit error event if close fails ([3be4ddc](https://github.com/atSCM/atscm/commit/3be4ddc))
* **watchers:** Handle errors ([13b076c](https://github.com/atSCM/atscm/commit/13b076c))


### Chores

* **release:** Version 0.2.1-alpha.7 ([734e87a](https://github.com/atSCM/atscm/commit/734e87a))


### Features

* **AtviseFile:** Add AtviseFile.read ([dba5498](https://github.com/atSCM/atscm/commit/dba5498))
* **AtviseFile:** Normalize file mtime when created form ReadResult ([bd55033](https://github.com/atSCM/atscm/commit/bd55033))
* **AtviseFile:** Store node timestamp as file mtime ([84e2c2a](https://github.com/atSCM/atscm/commit/84e2c2a))
* **NodeStream:** Retry failing browse operations ([2b61168](https://github.com/atSCM/atscm/commit/2b61168))
* **ReadStream:** Store node timestamp as file mtime ([4b8ead4](https://github.com/atSCM/atscm/commit/4b8ead4))
* **tasks:** Add `watch` task ([cf9c8f5](https://github.com/atSCM/atscm/commit/cf9c8f5)), closes [#11](https://github.com/atSCM/atscm/issues/11)
* **tasks:** Add watchForFileChanges ([2b2a913](https://github.com/atSCM/atscm/commit/2b2a913))
* **tasks:** Add watchForFileChanges gulp task ([3345a25](https://github.com/atSCM/atscm/commit/3345a25))
* **tasks:** config: Better Transformer info ([36031e9](https://github.com/atSCM/atscm/commit/36031e9))
* Cleanup open sessions before exitting ([1818410](https://github.com/atSCM/atscm/commit/1818410))
* **tasks:** Implement server node watcher ([3104c43](https://github.com/atSCM/atscm/commit/3104c43))
* **tasks:** Implement server node watcher ([41cef52](https://github.com/atSCM/atscm/commit/41cef52))
* **tasks:** Use [browser-sync](https://www.browsersync.io) to reload browser on change ([e4d5740](https://github.com/atSCM/atscm/commit/e4d5740))
* **transformers:** SplittingTransformer now loads missing required files ([615cb73](https://github.com/atSCM/atscm/commit/615cb73))


### Performance Improvements

* **push:** Skip buffering source files ([48991ed](https://github.com/atSCM/atscm/commit/48991ed))


### BREAKING CHANGES

* release: Requires atscm-cli version >=0.2.0



<a name="0.2.1-alpha.7"></a>
## [0.2.1-alpha.7](https://github.com/atSCM/atscm/compare/0.2.0-alpha.1...v0.2.1-alpha.7) (2017-03-13)


### Bug Fixes

* **AtviseFile:** Ignore leading and trailing whitespaces and newlines when encoding ([269564a](https://github.com/atSCM/atscm/commit/269564a)), closes [#21](https://github.com/atSCM/atscm/issues/21)
* **mapping:** Encode/decode UInt64 ([0eef39e](https://github.com/atSCM/atscm/commit/0eef39e)), closes [#26](https://github.com/atSCM/atscm/issues/26)
* **mapping:** Fix invalid rc path for array varaiables ([7cda5bb](https://github.com/atSCM/atscm/commit/7cda5bb)), closes [#25](https://github.com/atSCM/atscm/issues/25)
* **NodeStream:** Use "maxRetries" option ([42aae0d](https://github.com/atSCM/atscm/commit/42aae0d))
* **push:** Prevent memory leak inside `glob-stream` ([c487a6f](https://github.com/atSCM/atscm/commit/c487a6f))
* **ScriptTransformer:** Handle invalid results ([b80be42](https://github.com/atSCM/atscm/commit/b80be42))
* **ScriptTransformer:** Warn on empty document ([a0b88df](https://github.com/atSCM/atscm/commit/a0b88df)), closes [#24](https://github.com/atSCM/atscm/issues/24)
* **server~Client:** Reject with Error ([79a3355](https://github.com/atSCM/atscm/commit/79a3355))
* **server~Watcher:** Emit browse and subscribe errors ([9b27533](https://github.com/atSCM/atscm/commit/9b27533))
* **Session:** Resolve with closing session ([7677aba](https://github.com/atSCM/atscm/commit/7677aba))
* **Syntax:** Fix typo ([fd6cfc1](https://github.com/atSCM/atscm/commit/fd6cfc1))
* **tasks:** Prevent node-opcua from logging to console ([#27](https://github.com/atSCM/atscm/issues/27)) ([e6c892d](https://github.com/atSCM/atscm/commit/e6c892d))
* **test:** Prevent opening to many sessions while testing ([afd3300](https://github.com/atSCM/atscm/commit/afd3300))
* **test:** Support empty mtime field ([03909e1](https://github.com/atSCM/atscm/commit/03909e1))
* **Transformer:** Fixes an issue where Transformer#constructor throws with options not containing direction ([022a9bd](https://github.com/atSCM/atscm/commit/022a9bd))
* **transformers:** Fixes an issue where Transformer#applyTransformers does not run all transformers ([97c042f](https://github.com/atSCM/atscm/commit/97c042f))
* **watch:** Ignore value changes of nodes that were just pushed ([7ccc546](https://github.com/atSCM/atscm/commit/7ccc546)), closes [#20](https://github.com/atSCM/atscm/issues/20)
* **Watcher:** Better error handling ([32b6e6c](https://github.com/atSCM/atscm/commit/32b6e6c))
* **Watcher:** Emit error event if close fails ([3be4ddc](https://github.com/atSCM/atscm/commit/3be4ddc))
* **watchers:** Handle errors ([13b076c](https://github.com/atSCM/atscm/commit/13b076c))


### Chores

* **release:** Version 0.2.1-alpha.7 ([734e87a](https://github.com/atSCM/atscm/commit/734e87a))


### Features

* **AtviseFile:** Add AtviseFile.read ([dba5498](https://github.com/atSCM/atscm/commit/dba5498))
* **AtviseFile:** Normalize file mtime when created form ReadResult ([bd55033](https://github.com/atSCM/atscm/commit/bd55033))
* **AtviseFile:** Store node timestamp as file mtime ([84e2c2a](https://github.com/atSCM/atscm/commit/84e2c2a))
* **NodeStream:** Retry failing browse operations ([2b61168](https://github.com/atSCM/atscm/commit/2b61168))
* **ReadStream:** Store node timestamp as file mtime ([4b8ead4](https://github.com/atSCM/atscm/commit/4b8ead4))
* **tasks:** Add `watch` task ([cf9c8f5](https://github.com/atSCM/atscm/commit/cf9c8f5)), closes [#11](https://github.com/atSCM/atscm/issues/11)
* **tasks:** Add watchForFileChanges ([2b2a913](https://github.com/atSCM/atscm/commit/2b2a913))
* **tasks:** Add watchForFileChanges gulp task ([3345a25](https://github.com/atSCM/atscm/commit/3345a25))
* **tasks:** config: Better Transformer info ([36031e9](https://github.com/atSCM/atscm/commit/36031e9))
* Cleanup open sessions before exitting ([1818410](https://github.com/atSCM/atscm/commit/1818410))
* **tasks:** Implement server node watcher ([3104c43](https://github.com/atSCM/atscm/commit/3104c43))
* **tasks:** Implement server node watcher ([41cef52](https://github.com/atSCM/atscm/commit/41cef52))
* **tasks:** Use [browser-sync](https://www.browsersync.io) to reload browser on change ([e4d5740](https://github.com/atSCM/atscm/commit/e4d5740))
* **transformers:** SplittingTransformer now loads missing required files ([615cb73](https://github.com/atSCM/atscm/commit/615cb73))


### Performance Improvements

* **push:** Skip buffering source files ([48991ed](https://github.com/atSCM/atscm/commit/48991ed))


### BREAKING CHANGES

* release: Requires atscm-cli version >=0.2.0



<a name="0.2.1-alpha.6"></a>
## [0.2.1-alpha.6](https://github.com/atSCM/atscm/compare/0.2.0-alpha.1...v0.2.1-alpha.6) (2017-03-13)


### Bug Fixes

* **AtviseFile:** Ignore leading and trailing whitespaces and newlines when encoding ([269564a](https://github.com/atSCM/atscm/commit/269564a)), closes [#21](https://github.com/atSCM/atscm/issues/21)
* **mapping:** Encode/decode UInt64 ([0eef39e](https://github.com/atSCM/atscm/commit/0eef39e)), closes [#26](https://github.com/atSCM/atscm/issues/26)
* **mapping:** Fix invalid rc path for array varaiables ([7cda5bb](https://github.com/atSCM/atscm/commit/7cda5bb)), closes [#25](https://github.com/atSCM/atscm/issues/25)
* **push:** Prevent memory leak inside `glob-stream` ([c487a6f](https://github.com/atSCM/atscm/commit/c487a6f))
* **ScriptTransformer:** Handle invalid results ([b80be42](https://github.com/atSCM/atscm/commit/b80be42))
* **ScriptTransformer:** Warn on empty document ([a0b88df](https://github.com/atSCM/atscm/commit/a0b88df)), closes [#24](https://github.com/atSCM/atscm/issues/24)
* **server~Client:** Reject with Error ([79a3355](https://github.com/atSCM/atscm/commit/79a3355))
* **server~Watcher:** Emit browse and subscribe errors ([9b27533](https://github.com/atSCM/atscm/commit/9b27533))
* **Session:** Resolve with closing session ([7677aba](https://github.com/atSCM/atscm/commit/7677aba))
* **Syntax:** Fix typo ([fd6cfc1](https://github.com/atSCM/atscm/commit/fd6cfc1))
* **test:** Prevent opening to many sessions while testing ([afd3300](https://github.com/atSCM/atscm/commit/afd3300))
* **test:** Support empty mtime field ([03909e1](https://github.com/atSCM/atscm/commit/03909e1))
* **Transformer:** Fixes an issue where Transformer#constructor throws with options not containing direction ([022a9bd](https://github.com/atSCM/atscm/commit/022a9bd))
* **transformers:** Fixes an issue where Transformer#applyTransformers does not run all transformers ([97c042f](https://github.com/atSCM/atscm/commit/97c042f))
* **watch:** Ignore value changes of nodes that were just pushed ([7ccc546](https://github.com/atSCM/atscm/commit/7ccc546)), closes [#20](https://github.com/atSCM/atscm/issues/20)
* **Watcher:** Better error handling ([32b6e6c](https://github.com/atSCM/atscm/commit/32b6e6c))
* **Watcher:** Emit error event if close fails ([3be4ddc](https://github.com/atSCM/atscm/commit/3be4ddc))
* **watchers:** Handle errors ([13b076c](https://github.com/atSCM/atscm/commit/13b076c))


### Features

* **AtviseFile:** Add AtviseFile.read ([dba5498](https://github.com/atSCM/atscm/commit/dba5498))
* **AtviseFile:** Normalize file mtime when created form ReadResult ([bd55033](https://github.com/atSCM/atscm/commit/bd55033))
* **AtviseFile:** Store node timestamp as file mtime ([84e2c2a](https://github.com/atSCM/atscm/commit/84e2c2a))
* **NodeStream:** Retry failing browse operations ([2b61168](https://github.com/atSCM/atscm/commit/2b61168))
* **ReadStream:** Store node timestamp as file mtime ([4b8ead4](https://github.com/atSCM/atscm/commit/4b8ead4))
* **tasks:** Add `watch` task ([cf9c8f5](https://github.com/atSCM/atscm/commit/cf9c8f5)), closes [#11](https://github.com/atSCM/atscm/issues/11)
* **tasks:** Add watchForFileChanges ([2b2a913](https://github.com/atSCM/atscm/commit/2b2a913))
* **tasks:** Add watchForFileChanges gulp task ([3345a25](https://github.com/atSCM/atscm/commit/3345a25))
* **tasks:** config: Better Transformer info ([36031e9](https://github.com/atSCM/atscm/commit/36031e9))
* Cleanup open sessions before exitting ([1818410](https://github.com/atSCM/atscm/commit/1818410))
* **tasks:** Implement server node watcher ([3104c43](https://github.com/atSCM/atscm/commit/3104c43))
* **tasks:** Implement server node watcher ([41cef52](https://github.com/atSCM/atscm/commit/41cef52))
* **tasks:** Use [browser-sync](https://www.browsersync.io) to reload browser on change ([e4d5740](https://github.com/atSCM/atscm/commit/e4d5740))
* **transformers:** SplittingTransformer now loads missing required files ([615cb73](https://github.com/atSCM/atscm/commit/615cb73))


### Performance Improvements

* **push:** Skip buffering source files ([48991ed](https://github.com/atSCM/atscm/commit/48991ed))



<a name="0.2.1-alpha.5"></a>
## [0.2.1-alpha.5](https://github.com/atSCM/atscm/compare/0.2.0-alpha.1...v0.2.1-alpha.5) (2017-03-10)


### Bug Fixes

* **AtviseFile:** Ignore leading and trailing whitespaces and newlines when encoding ([269564a](https://github.com/atSCM/atscm/commit/269564a)), closes [#21](https://github.com/atSCM/atscm/issues/21)
* **mapping:** Encode/decode UInt64 ([0eef39e](https://github.com/atSCM/atscm/commit/0eef39e)), closes [#26](https://github.com/atSCM/atscm/issues/26)
* **mapping:** Fix invalid rc path for array varaiables ([7cda5bb](https://github.com/atSCM/atscm/commit/7cda5bb)), closes [#25](https://github.com/atSCM/atscm/issues/25)
* **ScriptTransformer:** Handle invalid results ([b80be42](https://github.com/atSCM/atscm/commit/b80be42))
* **ScriptTransformer:** Warn on empty document ([a0b88df](https://github.com/atSCM/atscm/commit/a0b88df)), closes [#24](https://github.com/atSCM/atscm/issues/24)
* **server~Client:** Reject with Error ([79a3355](https://github.com/atSCM/atscm/commit/79a3355))
* **server~Watcher:** Emit browse and subscribe errors ([9b27533](https://github.com/atSCM/atscm/commit/9b27533))
* **Session:** Resolve with closing session ([7677aba](https://github.com/atSCM/atscm/commit/7677aba))
* **Syntax:** Fix typo ([fd6cfc1](https://github.com/atSCM/atscm/commit/fd6cfc1))
* **test:** Prevent opening to many sessions while testing ([afd3300](https://github.com/atSCM/atscm/commit/afd3300))
* **test:** Support empty mtime field ([03909e1](https://github.com/atSCM/atscm/commit/03909e1))
* **Transformer:** Fixes an issue where Transformer#constructor throws with options not containing direction ([022a9bd](https://github.com/atSCM/atscm/commit/022a9bd))
* **transformers:** Fixes an issue where Transformer#applyTransformers does not run all transformers ([97c042f](https://github.com/atSCM/atscm/commit/97c042f))
* **watch:** Ignore value changes of nodes that were just pushed ([7ccc546](https://github.com/atSCM/atscm/commit/7ccc546)), closes [#20](https://github.com/atSCM/atscm/issues/20)
* **Watcher:** Better error handling ([32b6e6c](https://github.com/atSCM/atscm/commit/32b6e6c))
* **Watcher:** Emit error event if close fails ([3be4ddc](https://github.com/atSCM/atscm/commit/3be4ddc))
* **watchers:** Handle errors ([13b076c](https://github.com/atSCM/atscm/commit/13b076c))


### Features

* **AtviseFile:** Add AtviseFile.read ([dba5498](https://github.com/atSCM/atscm/commit/dba5498))
* **AtviseFile:** Normalize file mtime when created form ReadResult ([bd55033](https://github.com/atSCM/atscm/commit/bd55033))
* **AtviseFile:** Store node timestamp as file mtime ([84e2c2a](https://github.com/atSCM/atscm/commit/84e2c2a))
* **NodeStream:** Retry failing browse operations ([2b61168](https://github.com/atSCM/atscm/commit/2b61168))
* **ReadStream:** Store node timestamp as file mtime ([4b8ead4](https://github.com/atSCM/atscm/commit/4b8ead4))
* **tasks:** Add `watch` task ([cf9c8f5](https://github.com/atSCM/atscm/commit/cf9c8f5)), closes [#11](https://github.com/atSCM/atscm/issues/11)
* **tasks:** Add watchForFileChanges ([2b2a913](https://github.com/atSCM/atscm/commit/2b2a913))
* **tasks:** Add watchForFileChanges gulp task ([3345a25](https://github.com/atSCM/atscm/commit/3345a25))
* **tasks:** config: Better Transformer info ([36031e9](https://github.com/atSCM/atscm/commit/36031e9))
* **tasks:** Implement server node watcher ([3104c43](https://github.com/atSCM/atscm/commit/3104c43))
* **tasks:** Implement server node watcher ([41cef52](https://github.com/atSCM/atscm/commit/41cef52))
* **tasks:** Use [browser-sync](https://www.browsersync.io) to reload browser on change ([e4d5740](https://github.com/atSCM/atscm/commit/e4d5740))
* **transformers:** SplittingTransformer now loads missing required files ([615cb73](https://github.com/atSCM/atscm/commit/615cb73))


### Performance Improvements

* **push:** Skip buffering source files ([48991ed](https://github.com/atSCM/atscm/commit/48991ed))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/atSCM/atscm/compare/0.2.0-alpha.1...v0.2.0) (2017-03-08)


### Bug Fixes

* **AtviseFile:** Ignore leading and trailing whitespaces and newlines when encoding ([269564a](https://github.com/atSCM/atscm/commit/269564a)), closes [#21](https://github.com/atSCM/atscm/issues/21)
* **server~Client:** Reject with Error ([79a3355](https://github.com/atSCM/atscm/commit/79a3355))
* **server~Watcher:** Emit browse and subscribe errors ([9b27533](https://github.com/atSCM/atscm/commit/9b27533))
* **Syntax:** Fix typo ([fd6cfc1](https://github.com/atSCM/atscm/commit/fd6cfc1))
* **test:** Support empty mtime field ([03909e1](https://github.com/atSCM/atscm/commit/03909e1))
* **Transformer:** Fixes an issue where Transformer#constructor throws with options not containing direction ([022a9bd](https://github.com/atSCM/atscm/commit/022a9bd))
* **transformers:** Fixes an issue where Transformer#applyTransformers does not run all transformers ([97c042f](https://github.com/atSCM/atscm/commit/97c042f))
* **watch:** Ignore value changes of nodes that were just pushed ([7ccc546](https://github.com/atSCM/atscm/commit/7ccc546)), closes [#20](https://github.com/atSCM/atscm/issues/20)
* **watchers:** Handle errors ([13b076c](https://github.com/atSCM/atscm/commit/13b076c))


### Features

* **AtviseFile:** Add AtviseFile.read ([dba5498](https://github.com/atSCM/atscm/commit/dba5498))
* **AtviseFile:** Normalize file mtime when created form ReadResult ([bd55033](https://github.com/atSCM/atscm/commit/bd55033))
* **AtviseFile:** Store node timestamp as file mtime ([84e2c2a](https://github.com/atSCM/atscm/commit/84e2c2a))
* **ReadStream:** Store node timestamp as file mtime ([4b8ead4](https://github.com/atSCM/atscm/commit/4b8ead4))
* **tasks:** Add `watch` task ([cf9c8f5](https://github.com/atSCM/atscm/commit/cf9c8f5)), closes [#11](https://github.com/atSCM/atscm/issues/11)
* **tasks:** Add watchForFileChanges ([2b2a913](https://github.com/atSCM/atscm/commit/2b2a913))
* **tasks:** Add watchForFileChanges gulp task ([3345a25](https://github.com/atSCM/atscm/commit/3345a25))
* **tasks:** config: Better Transformer info ([36031e9](https://github.com/atSCM/atscm/commit/36031e9))
* **tasks:** Implement server node watcher ([3104c43](https://github.com/atSCM/atscm/commit/3104c43))
* **tasks:** Implement server node watcher ([41cef52](https://github.com/atSCM/atscm/commit/41cef52))
* **tasks:** Use [browser-sync](https://www.browsersync.io) to reload browser on change ([e4d5740](https://github.com/atSCM/atscm/commit/e4d5740))
* **transformers:** SplittingTransformer now loads missing required files ([615cb73](https://github.com/atSCM/atscm/commit/615cb73))



<a name="0.2.0-alpha.4"></a>
# [0.2.0-alpha.4](https://github.com/atSCM/atscm/compare/0.2.0-alpha.1...v0.2.0-alpha.4) (2017-03-08)


### Bug Fixes

* **AtviseFile:** Ignore leading and trailing whitespaces and newlines when encoding ([269564a](https://github.com/atSCM/atscm/commit/269564a)), closes [#21](https://github.com/atSCM/atscm/issues/21)
* **server~Client:** Reject with Error ([79a3355](https://github.com/atSCM/atscm/commit/79a3355))
* **server~Watcher:** Emit browse and subscribe errors ([9b27533](https://github.com/atSCM/atscm/commit/9b27533))
* **Syntax:** Fix typo ([fd6cfc1](https://github.com/atSCM/atscm/commit/fd6cfc1))
* **test:** Support empty mtime field ([03909e1](https://github.com/atSCM/atscm/commit/03909e1))
* **Transformer:** Fixes an issue where Transformer#constructor throws with options not containing direction ([022a9bd](https://github.com/atSCM/atscm/commit/022a9bd))
* **transformers:** Fixes an issue where Transformer#applyTransformers does not run all transformers ([97c042f](https://github.com/atSCM/atscm/commit/97c042f))
* **watch:** Ignore value changes of nodes that were just pushed ([7ccc546](https://github.com/atSCM/atscm/commit/7ccc546)), closes [#20](https://github.com/atSCM/atscm/issues/20)
* **watchers:** Handle errors ([13b076c](https://github.com/atSCM/atscm/commit/13b076c))


### Features

* **AtviseFile:** Add AtviseFile.read ([dba5498](https://github.com/atSCM/atscm/commit/dba5498))
* **AtviseFile:** Normalize file mtime when created form ReadResult ([bd55033](https://github.com/atSCM/atscm/commit/bd55033))
* **AtviseFile:** Store node timestamp as file mtime ([84e2c2a](https://github.com/atSCM/atscm/commit/84e2c2a))
* **ReadStream:** Store node timestamp as file mtime ([4b8ead4](https://github.com/atSCM/atscm/commit/4b8ead4))
* **tasks:** Add `watch` task ([cf9c8f5](https://github.com/atSCM/atscm/commit/cf9c8f5)), closes [#11](https://github.com/atSCM/atscm/issues/11)
* **tasks:** Add watchForFileChanges ([2b2a913](https://github.com/atSCM/atscm/commit/2b2a913))
* **tasks:** Add watchForFileChanges gulp task ([3345a25](https://github.com/atSCM/atscm/commit/3345a25))
* **tasks:** config: Better Transformer info ([36031e9](https://github.com/atSCM/atscm/commit/36031e9))
* **tasks:** Implement server node watcher ([3104c43](https://github.com/atSCM/atscm/commit/3104c43))
* **tasks:** Implement server node watcher ([41cef52](https://github.com/atSCM/atscm/commit/41cef52))
* **tasks:** Use [browser-sync](https://www.browsersync.io) to reload browser on change ([e4d5740](https://github.com/atSCM/atscm/commit/e4d5740))
* **transformers:** SplittingTransformer now loads missing required files ([615cb73](https://github.com/atSCM/atscm/commit/615cb73))



<a name="0.2.0-alpha.3"></a>
# [0.2.0-alpha.3](https://github.com/atSCM/atscm/compare/0.2.0-alpha.1...v0.2.0-alpha.3) (2017-03-07)


### Bug Fixes

* **AtviseFile:** Ignore leading and trailing whitespaces and newlines when encoding ([269564a](https://github.com/atSCM/atscm/commit/269564a)), closes [#21](https://github.com/atSCM/atscm/issues/21)
* **Syntax:** Fix typo ([fd6cfc1](https://github.com/atSCM/atscm/commit/fd6cfc1))
* **test:** Support empty mtime field ([03909e1](https://github.com/atSCM/atscm/commit/03909e1))
* **Transformer:** Fixes an issue where Transformer#constructor throws with options not containing direction ([022a9bd](https://github.com/atSCM/atscm/commit/022a9bd))
* **transformers:** Fixes an issue where Transformer#applyTransformers does not run all transformers ([97c042f](https://github.com/atSCM/atscm/commit/97c042f))
* **watch:** Ignore value changes of nodes that were just pushed ([7ccc546](https://github.com/atSCM/atscm/commit/7ccc546)), closes [#20](https://github.com/atSCM/atscm/issues/20)


### Features

* **AtviseFile:** Add AtviseFile.read ([dba5498](https://github.com/atSCM/atscm/commit/dba5498))
* **AtviseFile:** Normalize file mtime when created form ReadResult ([bd55033](https://github.com/atSCM/atscm/commit/bd55033))
* **AtviseFile:** Store node timestamp as file mtime ([84e2c2a](https://github.com/atSCM/atscm/commit/84e2c2a))
* **ReadStream:** Store node timestamp as file mtime ([4b8ead4](https://github.com/atSCM/atscm/commit/4b8ead4))
* **tasks:** Add `watch` task ([cf9c8f5](https://github.com/atSCM/atscm/commit/cf9c8f5)), closes [#11](https://github.com/atSCM/atscm/issues/11)
* **tasks:** Add watchForFileChanges ([2b2a913](https://github.com/atSCM/atscm/commit/2b2a913))
* **tasks:** Add watchForFileChanges gulp task ([3345a25](https://github.com/atSCM/atscm/commit/3345a25))
* **tasks:** config: Better Transformer info ([36031e9](https://github.com/atSCM/atscm/commit/36031e9))
* **tasks:** Implement server node watcher ([3104c43](https://github.com/atSCM/atscm/commit/3104c43))
* **tasks:** Implement server node watcher ([41cef52](https://github.com/atSCM/atscm/commit/41cef52))
* **transformers:** SplittingTransformer now loads missing required files ([615cb73](https://github.com/atSCM/atscm/commit/615cb73))



<a name="0.2.0-alpha.2"></a>
# [0.2.0-alpha.2](https://github.com/atSCM/atscm/compare/0.2.0-alpha.1...v0.2.0-alpha.2) (2017-03-07)


### Bug Fixes

* **Syntax:** Fix typo ([fd6cfc1](https://github.com/atSCM/atscm/commit/fd6cfc1))
* **Transformer:** Fixes an issue where Transformer#constructor throws with options not containing direction ([022a9bd](https://github.com/atSCM/atscm/commit/022a9bd))
* **transformers:** Fixes an issue where Transformer#applyTransformers does not run all transformers ([97c042f](https://github.com/atSCM/atscm/commit/97c042f))


### Features

* **AtviseFile:** Add AtviseFile.read ([dba5498](https://github.com/atSCM/atscm/commit/dba5498))
* **AtviseFile:** Store node timestamp as file mtime ([84e2c2a](https://github.com/atSCM/atscm/commit/84e2c2a))
* **ReadStream:** Store node timestamp as file mtime ([4b8ead4](https://github.com/atSCM/atscm/commit/4b8ead4))
* **tasks:** Add `watch` task ([cf9c8f5](https://github.com/atSCM/atscm/commit/cf9c8f5)), closes [#11](https://github.com/atSCM/atscm/issues/11)
* **tasks:** Add watchForFileChanges ([2b2a913](https://github.com/atSCM/atscm/commit/2b2a913))
* **tasks:** Add watchForFileChanges gulp task ([3345a25](https://github.com/atSCM/atscm/commit/3345a25))
* **tasks:** config: Better Transformer info ([36031e9](https://github.com/atSCM/atscm/commit/36031e9))
* **tasks:** Implement server node watcher ([3104c43](https://github.com/atSCM/atscm/commit/3104c43))
* **tasks:** Implement server node watcher ([41cef52](https://github.com/atSCM/atscm/commit/41cef52))
* **transformers:** SplittingTransformer now loads missing required files ([615cb73](https://github.com/atSCM/atscm/commit/615cb73))



<a name="0.2.0-alpha.1"></a>
# [0.2.0-alpha.1](https://github.com/atSCM/atscm/compare/0.1.1...v0.2.0-alpha.1) (2017-03-01)


### Bug Fixes

* **AtviseFile:** Assign original array type ([c95d6db](https://github.com/atSCM/atscm/commit/c95d6db)), closes [#18](https://github.com/atSCM/atscm/issues/18)
* **MappingTransformer:** Exclude directories from mapping ([167ffe5](https://github.com/atSCM/atscm/commit/167ffe5))
* **test:** Return unexpected Promises in XMLTransformer tests ([0877e3c](https://github.com/atSCM/atscm/commit/0877e3c))
* **WriteStream:** Handle sync errors ([5e0292e](https://github.com/atSCM/atscm/commit/5e0292e))
* **XMLTransformer:** Prevent double escaping in CDATA ([246b5b5](https://github.com/atSCM/atscm/commit/246b5b5))


### Features

* **exports:** Export Transformer class ([af0d288](https://github.com/atSCM/atscm/commit/af0d288))
* **mapping:** Handle project ObjectTypes ([5106a61](https://github.com/atSCM/atscm/commit/5106a61))
* **mapping:** Support custom variable types ([d7b48d7](https://github.com/atSCM/atscm/commit/d7b48d7))
* **mapping:** Support split files ([e1a52fb](https://github.com/atSCM/atscm/commit/e1a52fb))
* **Mapping:** Store variables with `null` value ([1a21d0f](https://github.com/atSCM/atscm/commit/1a21d0f)), closes [#17](https://github.com/atSCM/atscm/issues/17)
* **transformer:** Use Transformers in tasks ([09f97bf](https://github.com/atSCM/atscm/commit/09f97bf)), closes [#10](https://github.com/atSCM/atscm/issues/10)
* Add AtviseFile#isScript and #isQuickDynamic helpers ([16a4dbe](https://github.com/atSCM/atscm/commit/16a4dbe))
* **transformers:** Add `DisplayTransformer` ([585303d](https://github.com/atSCM/atscm/commit/585303d)), closes [#9](https://github.com/atSCM/atscm/issues/9)
* **transformers:** Implement DisplayTransformer ([ccbe02b](https://github.com/atSCM/atscm/commit/ccbe02b)), closes [#8](https://github.com/atSCM/atscm/issues/8)
* **XMLTransformer:** Support forced CDATA ([0cb1634](https://github.com/atSCM/atscm/commit/0cb1634))
* **XMLTransformer:** Wrap in CDATA ([5583410](https://github.com/atSCM/atscm/commit/5583410))



<a name="0.1.2"></a>
## [0.1.2](https://github.com/atSCM/atscm/compare/0.1.1...v0.1.2) (2017-02-23)



<a name="0.1.1"></a>
## 0.1.1 (2017-02-22)


### Bug Fixes

* Export NodeId ([#2](https://github.com/atSCM/atscm/issues/2)) ([6d9a5e6](https://github.com/atSCM/atscm/commit/6d9a5e6))


### Features

* **tasks:** Add push task ([adc4b1a](https://github.com/atSCM/atscm/commit/adc4b1a))


### Performance Improvements

* **mapping:** Cache regular expressions ([0daf35e](https://github.com/atSCM/atscm/commit/0daf35e))

## [0.1.0](https://github.com/atSCM/atscm/releases/tag/v0.1.0) (2017-02-21)

- First release 
