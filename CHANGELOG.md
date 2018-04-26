<a name="0.6.0-beta.27"></a>
# 0.6.0-beta.27 (2018-04-26)


### Bug Fixes

* Do not transform reference config files ([#184](https://github.com/atSCM/atscm/issues/184)) ([8531734](https://github.com/atSCM/atscm/commits/8531734))
* Escape '&' and '<' in XML attribute values before encoding ([#152](https://github.com/atSCM/atscm/issues/152)) ([186a004](https://github.com/atSCM/atscm/commits/186a004)), closes [#150](https://github.com/atSCM/atscm/issues/150)
* Fix invalid Boolean decoding ([#139](https://github.com/atSCM/atscm/issues/139)) ([4626a42](https://github.com/atSCM/atscm/commits/4626a42))
* Handle parent reference type in nodes to browse ([#177](https://github.com/atSCM/atscm/issues/177)) ([cec8fe5](https://github.com/atSCM/atscm/commits/cec8fe5)), closes [#170](https://github.com/atSCM/atscm/issues/170)
* Ignore atvise server methods ([#166](https://github.com/atSCM/atscm/issues/166)) ([f40d85d](https://github.com/atSCM/atscm/commits/f40d85d)), closes [#153](https://github.com/atSCM/atscm/issues/153) [#143](https://github.com/atSCM/atscm/issues/143)
* Import scripts from '[@atscm](https://github.com/atscm)/server-scripts' ([#163](https://github.com/atSCM/atscm/issues/163)) ([4b6a590](https://github.com/atSCM/atscm/commits/4b6a590))
* **scripts:** Store custom metadata ([#180](https://github.com/atSCM/atscm/issues/180)) ([6bd8312](https://github.com/atSCM/atscm/commits/6bd8312)), closes [#170](https://github.com/atSCM/atscm/issues/170)
* Improve handling of circular references ([#179](https://github.com/atSCM/atscm/issues/179)) ([13aeeca](https://github.com/atSCM/atscm/commits/13aeeca)), closes [#170](https://github.com/atSCM/atscm/issues/170)
* Make `import` task available to gulp ([3832173](https://github.com/atSCM/atscm/commits/3832173))
* Map all history archive properties ([#176](https://github.com/atSCM/atscm/issues/176)) ([ab50f20](https://github.com/atSCM/atscm/commits/ab50f20)), closes [#170](https://github.com/atSCM/atscm/issues/170)
* Map webserver ports ([#183](https://github.com/atSCM/atscm/issues/183)) ([4cb71bd](https://github.com/atSCM/atscm/commits/4cb71bd))
* Preserve xml element order ([#147](https://github.com/atSCM/atscm/issues/147)) ([a809603](https://github.com/atSCM/atscm/commits/a809603)), closes [#46](https://github.com/atSCM/atscm/issues/46)
* **mapping:** Handle relative parameter targets in scripts ([#172](https://github.com/atSCM/atscm/issues/172)) ([e4782b0](https://github.com/atSCM/atscm/commits/e4782b0)), closes [#170](https://github.com/atSCM/atscm/issues/170)
* **mapping:** Skip non-atscm dot-files ([#145](https://github.com/atSCM/atscm/issues/145)) ([c23409b](https://github.com/atSCM/atscm/commits/c23409b)), closes [#144](https://github.com/atSCM/atscm/issues/144)
* **pull:** Warn if datasource is not connected ([#140](https://github.com/atSCM/atscm/issues/140)) ([e6917f8](https://github.com/atSCM/atscm/commits/e6917f8)), closes [#3](https://github.com/atSCM/atscm/issues/3)
* **push:** Correctly handle references ([#174](https://github.com/atSCM/atscm/issues/174)) ([b8d77a7](https://github.com/atSCM/atscm/commits/b8d77a7)), closes [#170](https://github.com/atSCM/atscm/issues/170)
* **push:** Process chunks respecting the node tree structure ([#173](https://github.com/atSCM/atscm/issues/173)) ([c0950ea](https://github.com/atSCM/atscm/commits/c0950ea)), closes [#170](https://github.com/atSCM/atscm/issues/170)
* **push:** Warn if atscm serverscript was not imported yet ([#142](https://github.com/atSCM/atscm/issues/142)) ([661aad9](https://github.com/atSCM/atscm/commits/661aad9)), closes [#141](https://github.com/atSCM/atscm/issues/141)
* Properly handle `--continue` flag ([#165](https://github.com/atSCM/atscm/issues/165)) ([4aa7e36](https://github.com/atSCM/atscm/commits/4aa7e36))
* Properly handle array value coding ([#137](https://github.com/atSCM/atscm/issues/137)) ([37e661a](https://github.com/atSCM/atscm/commits/37e661a))
* **watcher:** Update to new NodeStream API ([a5234da](https://github.com/atSCM/atscm/commits/a5234da))
* Store reference definition files for non-objects if needed ([#181](https://github.com/atSCM/atscm/issues/181)) ([d38b7dd](https://github.com/atSCM/atscm/commits/d38b7dd)), closes [#170](https://github.com/atSCM/atscm/issues/170)
* **watcher:** Wait for subscriptions and handle deletions ([#169](https://github.com/atSCM/atscm/issues/169)) ([85c2e54](https://github.com/atSCM/atscm/commits/85c2e54)), closes [#91](https://github.com/atSCM/atscm/issues/91) [#157](https://github.com/atSCM/atscm/issues/157)


### Features

* Continue on failure with `--continue` flag used ([#151](https://github.com/atSCM/atscm/issues/151)) ([eebbcf1](https://github.com/atSCM/atscm/commits/eebbcf1)), closes [#90](https://github.com/atSCM/atscm/issues/90)
* Create nodes on push ([#138](https://github.com/atSCM/atscm/issues/138)) ([d84531b](https://github.com/atSCM/atscm/commits/d84531b)), closes [#32](https://github.com/atSCM/atscm/issues/32)
* New `import` task ([#129](https://github.com/atSCM/atscm/issues/129)) ([faa769d](https://github.com/atSCM/atscm/commits/faa769d))
* **import:** Use scripts from [@atscm](https://github.com/atscm)/server-scripts package ([#160](https://github.com/atSCM/atscm/issues/160)) ([767be22](https://github.com/atSCM/atscm/commits/767be22))




<a name="0.5.1"></a>
## 0.5.1 (2018-02-16)


### Bug Fixes

* **init:** Use node version 8 aware babel preset ([#133](https://github.com/atSCM/atscm/issues/133)) ([0535294](https://github.com/atSCM/atscm/commits/0535294)), closes [#132](https://github.com/atSCM/atscm/issues/132)




<a name="0.5.0"></a>
# 0.5.0 (2018-02-09)


### Features

* Update nodejs to version 8 ([#125](https://github.com/atSCM/atscm/issues/125)) ([9455aaf](https://github.com/atSCM/atscm/commits/9455aaf))




<a name="0.4.3"></a>
## 0.4.3 (2018-02-08)


### Bug Fixes

* **docs:** Update links to node-opcua api docs ([#116](https://github.com/atSCM/atscm/issues/116)) ([a609adb](https://github.com/atSCM/atscm/commits/a609adb))




<a name="0.4.2"></a>
## 0.4.2 (2017-12-19)


### Bug Fixes

* **test:** Compile sources before running windows tests ([#103](https://github.com/atSCM/atscm/issues/103)) ([b79a45d](https://github.com/atSCM/atscm/commits/b79a45d)), closes [#74](https://github.com/atSCM/atscm/issues/74)




<a name="0.4.1"></a>
## 0.4.1 (2017-12-18)


### Bug Fixes

* **gh-pages:** Fix typo ([9d1b1f4](https://github.com/atSCM/atscm/commits/9d1b1f4))


### Reverts

* chore(release): Release 0.5.0 [ci skip] ([794b5dd](https://github.com/atSCM/atscm/commits/794b5dd))




<a name="0.4.0"></a>
# 0.4.0 (2017-11-21)


### Bug Fixes

* **AtviseFile:** Add encoding for byte strings ([#72](https://github.com/atSCM/atscm/issues/72)) ([9cd9a60](https://github.com/atSCM/atscm/commits/9cd9a60)), closes [#62](https://github.com/atSCM/atscm/issues/62)
* **ci:** Deploy master and beta only ([1f38ea1](https://github.com/atSCM/atscm/commits/1f38ea1))
* **docs:** Document deployment process ([#67](https://github.com/atSCM/atscm/issues/67)) ([998e195](https://github.com/atSCM/atscm/commits/998e195))
* **init:** Do not escape author field in package.json ([#55](https://github.com/atSCM/atscm/issues/55)) ([160fffc](https://github.com/atSCM/atscm/commits/160fffc)), closes [#52](https://github.com/atSCM/atscm/issues/52)
* **watch:** Warn if `src` directory does not exist ([1bb0d75](https://github.com/atSCM/atscm/commits/1bb0d75))
* **watch:** Warn if `src` directory does not exist ([2992025](https://github.com/atSCM/atscm/commits/2992025)), closes [#47](https://github.com/atSCM/atscm/issues/47)
* Add Int64 variable support ([#76](https://github.com/atSCM/atscm/issues/76)) ([b2a583e](https://github.com/atSCM/atscm/commits/b2a583e))


### Features

* Override project configuration with `ATSCM_PROJECT` env variables ([8798d4e](https://github.com/atSCM/atscm/commits/8798d4e))
* **ci:** Automated release ([#65](https://github.com/atSCM/atscm/issues/65)) ([dcf48b7](https://github.com/atSCM/atscm/commits/dcf48b7))
* **debugging:** Generate source maps for generated files ([#69](https://github.com/atSCM/atscm/issues/69)) ([369db82](https://github.com/atSCM/atscm/commits/369db82))




<a name="0.3.0"></a>
# 0.3.0 (2017-05-08)


### Bug Fixes

* **mapping:** Handle dirnames that contain multiple dots ([#43](https://github.com/atSCM/atscm/issues/43)) ([710fa4f](https://github.com/atSCM/atscm/commits/710fa4f))


### Features

* **transformer:** Use existing gulp plugins to implement custom transformers ([#49](https://github.com/atSCM/atscm/issues/49)) ([a6a3f71](https://github.com/atSCM/atscm/commits/a6a3f71))
* **Transformer:** Stream based transformers ([96dfd58](https://github.com/atSCM/atscm/commits/96dfd58))


### Reverts

* Feature: Stream based transformers ([#40](https://github.com/atSCM/atscm/issues/40)) ([6180d83](https://github.com/atSCM/atscm/commits/6180d83))




<a name="0.2.4"></a>
## 0.2.4 (2017-04-05)


### Bug Fixes

* **init:** Validate project name starts with a letter ([#36](https://github.com/atSCM/atscm/issues/36)) ([1364828](https://github.com/atSCM/atscm/commits/1364828)), closes [#35](https://github.com/atSCM/atscm/issues/35)




<a name="0.2.3"></a>
## 0.2.3 (2017-04-05)


### Bug Fixes

* **pull:** Invalid extensions for some help nodes under atvise server v3.1.0 ([#34](https://github.com/atSCM/atscm/issues/34)) ([9bc0ba5](https://github.com/atSCM/atscm/commits/9bc0ba5)), closes [#30979901f57add197b769cc2f0cf2f1896ac05](https://github.com/atSCM/atscm/issues/30979901f57add197b769cc2f0cf2f1896ac05)




<a name="0.2.2"></a>
## 0.2.2 (2017-03-20)


### Bug Fixes

* **DisplayTransformer:** Link dependencies with `xlink:href` attribute ([0974c07](https://github.com/atSCM/atscm/commits/0974c07)), closes [#30](https://github.com/atSCM/atscm/issues/30)
* **logging:** Use windows-friendly stdout stream ([f8d91a5](https://github.com/atSCM/atscm/commits/f8d91a5))
* **mapping:** Replace invalid data type for html help documents ([6344853](https://github.com/atSCM/atscm/commits/6344853))
* **NodeStream:** Replace invalid error message on timeout ([5b9368b](https://github.com/atSCM/atscm/commits/5b9368b))
* **Pull/PushStream:** Clear line only when written before ([8137eea](https://github.com/atSCM/atscm/commits/8137eea))
* **Session:** Fixes an issue where currently opening session are not closed ([4d31d6a](https://github.com/atSCM/atscm/commits/4d31d6a))
* **tasks:** Prevent clearing unused lines when using log level < 3 ([c8f26b1](https://github.com/atSCM/atscm/commits/c8f26b1))
* **Transformer:** Incorrect depth handling in #inspect ([65a0de1](https://github.com/atSCM/atscm/commits/65a0de1))
* **watchForChanges:** Prevent multiple callback calls on multiple errors ([9eee5c2](https://github.com/atSCM/atscm/commits/9eee5c2))
* **WriteStream:** Warn if files are open in atvise builder ([#31](https://github.com/atSCM/atscm/issues/31)) ([98dcf83](https://github.com/atSCM/atscm/commits/98dcf83))


### Features

* **mapping:** Support files without extension ([8c729a9](https://github.com/atSCM/atscm/commits/8c729a9))
* **Stream:** Add ability to keep session alive through the `keepSessionAlive` option ([6118656](https://github.com/atSCM/atscm/commits/6118656))
* **tasks:** Better progress logging ([bdca246](https://github.com/atSCM/atscm/commits/bdca246))
* **XMLTransformer:** Use OS-specific newline ([87935f0](https://github.com/atSCM/atscm/commits/87935f0))


### Performance Improvements

* **pull:** Browse atvise server nodes in parallel ([2c70013](https://github.com/atSCM/atscm/commits/2c70013))
* **pull:** Read atvise server nodes in parallel ([5a34ef0](https://github.com/atSCM/atscm/commits/5a34ef0))
* **watch:** Subscribe to atvise server nodes in parallel ([ededfd3](https://github.com/atSCM/atscm/commits/ededfd3))




<a name="0.2.1"></a>
## 0.2.1 (2017-03-13)


### Bug Fixes

* **mapping:** Encode/decode UInt64 ([0eef39e](https://github.com/atSCM/atscm/commits/0eef39e)), closes [#26](https://github.com/atSCM/atscm/issues/26)
* **mapping:** Fix invalid rc path for array varaiables ([7cda5bb](https://github.com/atSCM/atscm/commits/7cda5bb)), closes [#25](https://github.com/atSCM/atscm/issues/25)
* **NodeStream:** Use "maxRetries" option ([42aae0d](https://github.com/atSCM/atscm/commits/42aae0d))
* **push:** Prevent memory leak inside `glob-stream` ([c487a6f](https://github.com/atSCM/atscm/commits/c487a6f))
* **ScriptTransformer:** Handle invalid results ([b80be42](https://github.com/atSCM/atscm/commits/b80be42)), closes [#24](https://github.com/atSCM/atscm/issues/24)
* **ScriptTransformer:** Warn on empty document ([a0b88df](https://github.com/atSCM/atscm/commits/a0b88df)), closes [#24](https://github.com/atSCM/atscm/issues/24)
* **Session:** Resolve with closing session ([7677aba](https://github.com/atSCM/atscm/commits/7677aba))
* **tasks:** Prevent node-opcua from logging to console ([#27](https://github.com/atSCM/atscm/issues/27)) ([e6c892d](https://github.com/atSCM/atscm/commits/e6c892d))
* **test:** Prevent opening to many sessions while testing ([afd3300](https://github.com/atSCM/atscm/commits/afd3300))
* **Watcher:** Better error handling ([32b6e6c](https://github.com/atSCM/atscm/commits/32b6e6c))
* **Watcher:** Emit error event if close fails ([3be4ddc](https://github.com/atSCM/atscm/commits/3be4ddc))


### Chores

* **release:** Version 0.2.1-alpha.7 ([734e87a](https://github.com/atSCM/atscm/commits/734e87a))


### Features

* **NodeStream:** Retry failing browse operations ([2b61168](https://github.com/atSCM/atscm/commits/2b61168))
* Cleanup open sessions before exitting ([1818410](https://github.com/atSCM/atscm/commits/1818410))


### Performance Improvements

* **push:** Skip buffering source files ([48991ed](https://github.com/atSCM/atscm/commits/48991ed))


### BREAKING CHANGES

* **release:** Requires atscm-cli version >=0.2.0




<a name="0.2.0"></a>
# 0.2.0 (2017-03-08)


### Bug Fixes

* **AtviseFile:** Assign original array type ([c95d6db](https://github.com/atSCM/atscm/commits/c95d6db)), closes [#18](https://github.com/atSCM/atscm/issues/18)
* **AtviseFile:** Ignore leading and trailing whitespaces and newlines when encoding ([269564a](https://github.com/atSCM/atscm/commits/269564a)), closes [#21](https://github.com/atSCM/atscm/issues/21)
* **MappingTransformer:** Exclude directories from mapping ([167ffe5](https://github.com/atSCM/atscm/commits/167ffe5))
* **server~Client:** Reject with Error ([79a3355](https://github.com/atSCM/atscm/commits/79a3355))
* **server~Watcher:** Emit browse and subscribe errors ([9b27533](https://github.com/atSCM/atscm/commits/9b27533))
* **Syntax:** Fix typo ([fd6cfc1](https://github.com/atSCM/atscm/commits/fd6cfc1))
* **test:** Return unexpected Promises in XMLTransformer tests ([0877e3c](https://github.com/atSCM/atscm/commits/0877e3c))
* **test:** Support empty mtime field ([03909e1](https://github.com/atSCM/atscm/commits/03909e1))
* **Transformer:** Fixes an issue where Transformer#constructor throws with options not containing direction ([022a9bd](https://github.com/atSCM/atscm/commits/022a9bd))
* **transformers:** Fixes an issue where Transformer#applyTransformers does not run all transformers ([97c042f](https://github.com/atSCM/atscm/commits/97c042f))
* **watch:** Ignore value changes of nodes that were just pushed ([7ccc546](https://github.com/atSCM/atscm/commits/7ccc546)), closes [#20](https://github.com/atSCM/atscm/issues/20)
* **watchers:** Handle errors ([13b076c](https://github.com/atSCM/atscm/commits/13b076c))
* **WriteStream:** Handle sync errors ([5e0292e](https://github.com/atSCM/atscm/commits/5e0292e))
* **XMLTransformer:** Prevent double escaping in CDATA ([246b5b5](https://github.com/atSCM/atscm/commits/246b5b5))


### Features

* **AtviseFile:** Add AtviseFile.read ([dba5498](https://github.com/atSCM/atscm/commits/dba5498))
* **AtviseFile:** Normalize file mtime when created form ReadResult ([bd55033](https://github.com/atSCM/atscm/commits/bd55033))
* **AtviseFile:** Store node timestamp as file mtime ([84e2c2a](https://github.com/atSCM/atscm/commits/84e2c2a))
* **exports:** Export Transformer class ([af0d288](https://github.com/atSCM/atscm/commits/af0d288)), closes [#13](https://github.com/atSCM/atscm/issues/13)
* **mapping:** Handle project ObjectTypes ([5106a61](https://github.com/atSCM/atscm/commits/5106a61))
* **mapping:** Support custom variable types ([d7b48d7](https://github.com/atSCM/atscm/commits/d7b48d7)), closes [#12](https://github.com/atSCM/atscm/issues/12)
* **mapping:** Support split files ([e1a52fb](https://github.com/atSCM/atscm/commits/e1a52fb))
* **Mapping:** Store variables with `null` value ([1a21d0f](https://github.com/atSCM/atscm/commits/1a21d0f)), closes [#17](https://github.com/atSCM/atscm/issues/17)
* **ReadStream:** Store node timestamp as file mtime ([4b8ead4](https://github.com/atSCM/atscm/commits/4b8ead4))
* **tasks:** Add `watch` task ([cf9c8f5](https://github.com/atSCM/atscm/commits/cf9c8f5)), closes [#11](https://github.com/atSCM/atscm/issues/11)
* **tasks:** Add watchForFileChanges ([2b2a913](https://github.com/atSCM/atscm/commits/2b2a913))
* **tasks:** Add watchForFileChanges gulp task ([3345a25](https://github.com/atSCM/atscm/commits/3345a25))
* **tasks:** config: Better Transformer info ([36031e9](https://github.com/atSCM/atscm/commits/36031e9))
* **tasks:** Implement server node watcher ([3104c43](https://github.com/atSCM/atscm/commits/3104c43))
* **tasks:** Implement server node watcher ([41cef52](https://github.com/atSCM/atscm/commits/41cef52))
* **tasks:** Use [browser-sync](https://www.browsersync.io) to reload browser on change ([e4d5740](https://github.com/atSCM/atscm/commits/e4d5740))
* **transformer:** Use Transformers in tasks ([09f97bf](https://github.com/atSCM/atscm/commits/09f97bf)), closes [#10](https://github.com/atSCM/atscm/issues/10)
* Add AtviseFile#isScript and #isQuickDynamic helpers ([16a4dbe](https://github.com/atSCM/atscm/commits/16a4dbe))
* **transformers:** Add `DisplayTransformer` ([585303d](https://github.com/atSCM/atscm/commits/585303d)), closes [#9](https://github.com/atSCM/atscm/issues/9)
* **transformers:** Implement DisplayTransformer ([193c9e7](https://github.com/atSCM/atscm/commits/193c9e7)), closes [#15](https://github.com/atSCM/atscm/issues/15)
* **transformers:** Implement DisplayTransformer ([ccbe02b](https://github.com/atSCM/atscm/commits/ccbe02b)), closes [#8](https://github.com/atSCM/atscm/issues/8)
* **transformers:** SplittingTransformer now loads missing required files ([615cb73](https://github.com/atSCM/atscm/commits/615cb73))
* **XMLTransformer:** Support forced CDATA ([0cb1634](https://github.com/atSCM/atscm/commits/0cb1634))
* **XMLTransformer:** Wrap in CDATA ([5583410](https://github.com/atSCM/atscm/commits/5583410))




<a name="0.1.2"></a>
## 0.1.2 (2017-02-23)




<a name="0.1.1"></a>
## 0.1.1 (2017-02-22)


### Bug Fixes

* Export NodeId ([#2](https://github.com/atSCM/atscm/issues/2)) ([6d9a5e6](https://github.com/atSCM/atscm/commits/6d9a5e6))


### Features

* **tasks:** Add push task ([adc4b1a](https://github.com/atSCM/atscm/commits/adc4b1a))


### Performance Improvements

* **mapping:** Cache regular expressions ([0daf35e](https://github.com/atSCM/atscm/commits/0daf35e))




<a name="0.1.0"></a>
# 0.1.0 (2017-02-21)



