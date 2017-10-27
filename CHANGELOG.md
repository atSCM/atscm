<a name="0.4.0-beta.1"></a>
# [0.4.0-beta.1](https://github.com/atSCM/atscm/compare/v0.3.0...v0.4.0-beta.1) (2017-10-27)


### Bug Fixes

* **init:** Do not escape author field in package.json ([#55](https://github.com/atSCM/atscm/issues/55)) ([160fffc](https://github.com/atSCM/atscm/commit/160fffc)), closes [#52](https://github.com/atSCM/atscm/issues/52)
* **watch:** Warn if `src` directory does not exist ([2992025](https://github.com/atSCM/atscm/commit/2992025)), closes [#47](https://github.com/atSCM/atscm/issues/47)


### Features

* Override project configuration with `ATSCM_PROJECT` env variables ([8798d4e](https://github.com/atSCM/atscm/commit/8798d4e))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/atSCM/atscm/compare/v0.2.4...v0.3.0) (2017-05-08)


### Bug Fixes

* **mapping:** Handle dirnames that contain multiple dots ([#43](https://github.com/atSCM/atscm/issues/43)) ([710fa4f](https://github.com/atSCM/atscm/commit/710fa4f))


### Features

* **transformer:** Use existing gulp plugins to implement custom transformers ([#49](https://github.com/atSCM/atscm/issues/49)) ([a6a3f71](https://github.com/atSCM/atscm/commit/a6a3f71))
* **Transformer:** Stream based transformers ([96dfd58](https://github.com/atSCM/atscm/commit/96dfd58))


### Reverts

* Feature: Stream based transformers ([#40](https://github.com/atSCM/atscm/issues/40)) ([6180d83](https://github.com/atSCM/atscm/commit/6180d83))



<a name="0.2.4"></a>
## [0.2.4](https://github.com/atSCM/atscm/compare/0.2.0-alpha.1...v0.2.4) (2017-04-05)


### Bug Fixes

* **AtviseFile:** Ignore leading and trailing whitespaces and newlines when encoding ([269564a](https://github.com/atSCM/atscm/commit/269564a)), closes [#21](https://github.com/atSCM/atscm/issues/21)
* **DisplayTransformer:** Link dependencies with `xlink:href` attribute ([0974c07](https://github.com/atSCM/atscm/commit/0974c07)), closes [#30](https://github.com/atSCM/atscm/issues/30)
* **init:** Validate project name starts with a letter ([#36](https://github.com/atSCM/atscm/issues/36)) ([1364828](https://github.com/atSCM/atscm/commit/1364828)), closes [#35](https://github.com/atSCM/atscm/issues/35)
* **logging:** Use windows-friendly stdout stream ([f8d91a5](https://github.com/atSCM/atscm/commit/f8d91a5))
* **mapping:** Encode/decode UInt64 ([0eef39e](https://github.com/atSCM/atscm/commit/0eef39e)), closes [#26](https://github.com/atSCM/atscm/issues/26)
* **mapping:** Fix invalid rc path for array varaiables ([7cda5bb](https://github.com/atSCM/atscm/commit/7cda5bb)), closes [#25](https://github.com/atSCM/atscm/issues/25)
* **mapping:** Replace invalid data type for html help documents ([6344853](https://github.com/atSCM/atscm/commit/6344853))
* **NodeStream:** Replace invalid error message on timeout ([5b9368b](https://github.com/atSCM/atscm/commit/5b9368b))
* **NodeStream:** Use "maxRetries" option ([42aae0d](https://github.com/atSCM/atscm/commit/42aae0d))
* **pull:** Invalid extensions for some help nodes under atvise server v3.1.0 ([#34](https://github.com/atSCM/atscm/issues/34)) ([9bc0ba5](https://github.com/atSCM/atscm/commit/9bc0ba5))
* **Pull/PushStream:** Clear line only when written before ([8137eea](https://github.com/atSCM/atscm/commit/8137eea))
* **push:** Prevent memory leak inside `glob-stream` ([c487a6f](https://github.com/atSCM/atscm/commit/c487a6f))
* **ScriptTransformer:** Handle invalid results ([b80be42](https://github.com/atSCM/atscm/commit/b80be42))
* **ScriptTransformer:** Warn on empty document ([a0b88df](https://github.com/atSCM/atscm/commit/a0b88df)), closes [#24](https://github.com/atSCM/atscm/issues/24)
* **server~Client:** Reject with Error ([79a3355](https://github.com/atSCM/atscm/commit/79a3355))
* **server~Watcher:** Emit browse and subscribe errors ([9b27533](https://github.com/atSCM/atscm/commit/9b27533))
* **Session:** Fixes an issue where currently opening session are not closed ([4d31d6a](https://github.com/atSCM/atscm/commit/4d31d6a))
* **Session:** Resolve with closing session ([7677aba](https://github.com/atSCM/atscm/commit/7677aba))
* **Syntax:** Fix typo ([fd6cfc1](https://github.com/atSCM/atscm/commit/fd6cfc1))
* **tasks:** Prevent clearing unused lines when using log level < 3 ([c8f26b1](https://github.com/atSCM/atscm/commit/c8f26b1))
* **tasks:** Prevent node-opcua from logging to console ([#27](https://github.com/atSCM/atscm/issues/27)) ([e6c892d](https://github.com/atSCM/atscm/commit/e6c892d))
* **test:** Prevent opening to many sessions while testing ([afd3300](https://github.com/atSCM/atscm/commit/afd3300))
* **test:** Support empty mtime field ([03909e1](https://github.com/atSCM/atscm/commit/03909e1))
* **Transformer:** Fixes an issue where Transformer#constructor throws with options not containing direction ([022a9bd](https://github.com/atSCM/atscm/commit/022a9bd))
* **Transformer:** Incorrect depth handling in #inspect ([65a0de1](https://github.com/atSCM/atscm/commit/65a0de1))
* **transformers:** Fixes an issue where Transformer#applyTransformers does not run all transformers ([97c042f](https://github.com/atSCM/atscm/commit/97c042f))
* **watch:** Ignore value changes of nodes that were just pushed ([7ccc546](https://github.com/atSCM/atscm/commit/7ccc546)), closes [#20](https://github.com/atSCM/atscm/issues/20)
* **Watcher:** Better error handling ([32b6e6c](https://github.com/atSCM/atscm/commit/32b6e6c))
* **Watcher:** Emit error event if close fails ([3be4ddc](https://github.com/atSCM/atscm/commit/3be4ddc))
* **watchers:** Handle errors ([13b076c](https://github.com/atSCM/atscm/commit/13b076c))
* **watchForChanges:** Prevent multiple callback calls on multiple errors ([9eee5c2](https://github.com/atSCM/atscm/commit/9eee5c2))
* **WriteStream:** Warn if files are open in atvise builder ([#31](https://github.com/atSCM/atscm/issues/31)) ([98dcf83](https://github.com/atSCM/atscm/commit/98dcf83))


### Chores

* **release:** Version 0.2.1-alpha.7 ([734e87a](https://github.com/atSCM/atscm/commit/734e87a))


### Features

* **AtviseFile:** Add AtviseFile.read ([dba5498](https://github.com/atSCM/atscm/commit/dba5498))
* **AtviseFile:** Normalize file mtime when created form ReadResult ([bd55033](https://github.com/atSCM/atscm/commit/bd55033))
* **AtviseFile:** Store node timestamp as file mtime ([84e2c2a](https://github.com/atSCM/atscm/commit/84e2c2a))
* **mapping:** Support files without extension ([8c729a9](https://github.com/atSCM/atscm/commit/8c729a9))
* **NodeStream:** Retry failing browse operations ([2b61168](https://github.com/atSCM/atscm/commit/2b61168))
* **ReadStream:** Store node timestamp as file mtime ([4b8ead4](https://github.com/atSCM/atscm/commit/4b8ead4))
* **Stream:** Add ability to keep session alive through the `keepSessionAlive` option ([6118656](https://github.com/atSCM/atscm/commit/6118656))
* **tasks:** Add `watch` task ([cf9c8f5](https://github.com/atSCM/atscm/commit/cf9c8f5)), closes [#11](https://github.com/atSCM/atscm/issues/11)
* **tasks:** Add watchForFileChanges ([2b2a913](https://github.com/atSCM/atscm/commit/2b2a913))
* **tasks:** Add watchForFileChanges gulp task ([3345a25](https://github.com/atSCM/atscm/commit/3345a25))
* **tasks:** Better progress logging ([bdca246](https://github.com/atSCM/atscm/commit/bdca246))
* **tasks:** config: Better Transformer info ([36031e9](https://github.com/atSCM/atscm/commit/36031e9))
* **tasks:** Implement server node watcher ([3104c43](https://github.com/atSCM/atscm/commit/3104c43))
* **tasks:** Implement server node watcher ([41cef52](https://github.com/atSCM/atscm/commit/41cef52))
* Cleanup open sessions before exitting ([1818410](https://github.com/atSCM/atscm/commit/1818410))
* **tasks:** Use [browser-sync](https://www.browsersync.io) to reload browser on change ([e4d5740](https://github.com/atSCM/atscm/commit/e4d5740))
* **transformers:** SplittingTransformer now loads missing required files ([615cb73](https://github.com/atSCM/atscm/commit/615cb73))
* **XMLTransformer:** Use OS-specific newline ([87935f0](https://github.com/atSCM/atscm/commit/87935f0))


### Performance Improvements

* **pull:** Browse atvise server nodes in parallel ([2c70013](https://github.com/atSCM/atscm/commit/2c70013))
* **pull:** Read atvise server nodes in parallel ([5a34ef0](https://github.com/atSCM/atscm/commit/5a34ef0))
* **push:** Skip buffering source files ([48991ed](https://github.com/atSCM/atscm/commit/48991ed))
* **watch:** Subscribe to atvise server nodes in parallel ([ededfd3](https://github.com/atSCM/atscm/commit/ededfd3))


### BREAKING CHANGES

* **release:** Requires atscm-cli version >=0.2.0



<a name="0.2.0-alpha.1"></a>
# [0.2.0-alpha.1](https://github.com/atSCM/atscm/compare/0.1.1...0.2.0-alpha.1) (2017-03-01)


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



<a name="0.1.1"></a>
## [0.1.1](https://github.com/atSCM/atscm/compare/6d9a5e6...0.1.1) (2017-02-22)


### Bug Fixes

* Export NodeId ([#2](https://github.com/atSCM/atscm/issues/2)) ([6d9a5e6](https://github.com/atSCM/atscm/commit/6d9a5e6))


### Features

* **tasks:** Add push task ([adc4b1a](https://github.com/atSCM/atscm/commit/adc4b1a))


### Performance Improvements

* **mapping:** Cache regular expressions ([0daf35e](https://github.com/atSCM/atscm/commit/0daf35e))



