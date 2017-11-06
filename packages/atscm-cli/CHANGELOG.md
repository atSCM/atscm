<a name="0.3.0"></a>
# [0.3.0](https://github.com/atSCM/atscm-cli/compare/v0.2.4...v0.3.0) (2017-11-06)


### Bug Fixes

* **ci:** Deploy master and beta only ([63393b8](https://github.com/atSCM/atscm-cli/commit/63393b8))
* **docs:** Document deployment process ([#29](https://github.com/atSCM/atscm-cli/issues/29)) ([782d826](https://github.com/atSCM/atscm-cli/commit/782d826))


### Features

* **ci:** Automated release ([#27](https://github.com/atSCM/atscm-cli/issues/27)) ([ff9f82a](https://github.com/atSCM/atscm-cli/commit/ff9f82a))
* **init:** Use `--beta` flag to update prerelease versions ([#31](https://github.com/atSCM/atscm-cli/issues/31)) ([7f8b9ed](https://github.com/atSCM/atscm-cli/commit/7f8b9ed))



<a name="0.2.4"></a>
## [0.2.4](https://github.com/atSCM/atscm-cli/compare/0.2.0-alpha.1...v0.2.4) (2017-10-17)


### Bug Fixes

* **init:** Always run in current working directory unless `--cwd` is passed ([#16](https://github.com/atSCM/atscm-cli/issues/16)) ([4beabdf](https://github.com/atSCM/atscm-cli/commit/4beabdf)), closes [#14](https://github.com/atSCM/atscm-cli/issues/14)
* **Logger:** Print as single message ([a251179](https://github.com/atSCM/atscm-cli/commit/a251179))
* **Logger:** Use windows-friendly stdout API ([2693bbd](https://github.com/atSCM/atscm-cli/commit/2693bbd))
* **run:** Allow `atscm --tasks` with current gulp-cli version ([#24](https://github.com/atSCM/atscm-cli/issues/24)) ([1820107](https://github.com/atSCM/atscm-cli/commit/1820107))
* **test:** Use windows-friendly paths ([3ff7018](https://github.com/atSCM/atscm-cli/commit/3ff7018))


### Features

* **docs:** Open hosted API documentation with `--remote` option passed ([#18](https://github.com/atSCM/atscm-cli/issues/18)) ([2cb4ca7](https://github.com/atSCM/atscm-cli/commit/2cb4ca7)), closes [#13](https://github.com/atSCM/atscm-cli/issues/13)
* **init:** Override existing files using the `--force` option ([#15](https://github.com/atSCM/atscm-cli/issues/15)) ([ccd4abf](https://github.com/atSCM/atscm-cli/commit/ccd4abf)), closes [#10](https://github.com/atSCM/atscm-cli/issues/10)
* Add source maps and beta flag ([#26](https://github.com/atSCM/atscm-cli/issues/26)) ([bf7e748](https://github.com/atSCM/atscm-cli/commit/bf7e748))
* Automatically check for package updates ([#21](https://github.com/atSCM/atscm-cli/issues/21)) ([19afc94](https://github.com/atSCM/atscm-cli/commit/19afc94)), closes [#19](https://github.com/atSCM/atscm-cli/issues/19)
* Pass options by setting env vars named `ATSCM_{options}={value}` ([#23](https://github.com/atSCM/atscm-cli/issues/23)) ([4f23e91](https://github.com/atSCM/atscm-cli/commit/4f23e91))
* Update atscm by running `atscm update` ([6adfa60](https://github.com/atSCM/atscm-cli/commit/6adfa60))



<a name="0.2.0-alpha.1"></a>
# [0.2.0-alpha.1](https://github.com/atSCM/atscm-cli/compare/055edf5...0.2.0-alpha.1) (2017-03-13)


### Bug Fixes

* **test:** Fixed invalid test paths ([055edf5](https://github.com/atSCM/atscm-cli/commit/055edf5))


### Features

* **Logger:** Ignore empty lines when using #pipeLastLine ([f3d34cc](https://github.com/atSCM/atscm-cli/commit/f3d34cc))
* **Logger:** Print to own Console instance ([b77c0eb](https://github.com/atSCM/atscm-cli/commit/b77c0eb))



