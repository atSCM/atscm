<a name="0.3.4"></a>
## 0.3.4 (2018-01-25)


### Bug Fixes

* **package:** Force gulp-cli version 1.2.2 ([244f9e6](https://github.com/atSCM/atscm-cli/commits/244f9e6)), closes [#52](https://github.com/atSCM/atscm-cli/issues/52)




<a name="0.3.3"></a>
## 0.3.3 (2018-01-25)


### Bug Fixes

* Downgrade gulp-cli ([4e61612](https://github.com/atSCM/atscm-cli/commits/4e61612)), closes [#41](https://github.com/atSCM/atscm-cli/issues/41)


### Reverts

* fix(package): update gulp-cli to version 2.0.0 ([#41](https://github.com/atSCM/atscm-cli/issues/41)) ([7ae6b1f](https://github.com/atSCM/atscm-cli/commits/7ae6b1f))




<a name="0.3.2"></a>
## 0.3.2 (2018-01-08)


### Bug Fixes

* **package:** update gulp-cli to version 2.0.0 ([#41](https://github.com/atSCM/atscm-cli/issues/41)) ([f4415a9](https://github.com/atSCM/atscm-cli/commits/f4415a9))
* **package:** update inquirer to version 5.0.0 ([#42](https://github.com/atSCM/atscm-cli/issues/42)) ([09c576c](https://github.com/atSCM/atscm-cli/commits/09c576c))
* Rename tasks option to prevent name conflict with gulp-cli 2.0 ([4d138be](https://github.com/atSCM/atscm-cli/commits/4d138be))




<a name="0.3.1"></a>
## 0.3.1 (2017-12-19)


### Bug Fixes

* Host API docs on github pages ([#38](https://github.com/atSCM/atscm-cli/issues/38)) ([951f588](https://github.com/atSCM/atscm-cli/commits/951f588)), closes [#36](https://github.com/atSCM/atscm-cli/issues/36)
* Use [@ls-age](https://github.com/ls-age)/bump-version for automated releases ([#37](https://github.com/atSCM/atscm-cli/issues/37)) ([c556a15](https://github.com/atSCM/atscm-cli/commits/c556a15)), closes [#34](https://github.com/atSCM/atscm-cli/issues/34)




<a name="0.3.0"></a>
# 0.3.0 (2017-11-06)


### Bug Fixes

* **ci:** Deploy master and beta only ([63393b8](https://github.com/atSCM/atscm-cli/commits/63393b8))
* **docs:** Document deployment process ([#29](https://github.com/atSCM/atscm-cli/issues/29)) ([782d826](https://github.com/atSCM/atscm-cli/commits/782d826))


### Features

* **ci:** Automated release ([#27](https://github.com/atSCM/atscm-cli/issues/27)) ([ff9f82a](https://github.com/atSCM/atscm-cli/commits/ff9f82a))
* **init:** Use `--beta` flag to update prerelease versions ([#31](https://github.com/atSCM/atscm-cli/issues/31)) ([7f8b9ed](https://github.com/atSCM/atscm-cli/commits/7f8b9ed))




<a name="0.2.4"></a>
## 0.2.4 (2017-10-17)


### Bug Fixes

* **init:** Always run in current working directory unless `--cwd` is passed ([#16](https://github.com/atSCM/atscm-cli/issues/16)) ([4beabdf](https://github.com/atSCM/atscm-cli/commits/4beabdf)), closes [#14](https://github.com/atSCM/atscm-cli/issues/14)
* **run:** Allow `atscm --tasks` with current gulp-cli version ([#24](https://github.com/atSCM/atscm-cli/issues/24)) ([1820107](https://github.com/atSCM/atscm-cli/commits/1820107))


### Features

* **docs:** Open hosted API documentation with `--remote` option passed ([#18](https://github.com/atSCM/atscm-cli/issues/18)) ([2cb4ca7](https://github.com/atSCM/atscm-cli/commits/2cb4ca7)), closes [#13](https://github.com/atSCM/atscm-cli/issues/13)
* **init:** Override existing files using the `--force` option ([#15](https://github.com/atSCM/atscm-cli/issues/15)) ([ccd4abf](https://github.com/atSCM/atscm-cli/commits/ccd4abf)), closes [#10](https://github.com/atSCM/atscm-cli/issues/10)
* Add source maps and beta flag ([#26](https://github.com/atSCM/atscm-cli/issues/26)) ([bf7e748](https://github.com/atSCM/atscm-cli/commits/bf7e748))
* Automatically check for package updates ([#21](https://github.com/atSCM/atscm-cli/issues/21)) ([19afc94](https://github.com/atSCM/atscm-cli/commits/19afc94)), closes [#19](https://github.com/atSCM/atscm-cli/issues/19)
* Pass options by setting env vars named `ATSCM_{options}={value}` ([#23](https://github.com/atSCM/atscm-cli/issues/23)) ([4f23e91](https://github.com/atSCM/atscm-cli/commits/4f23e91))
* Update atscm by running `atscm update` ([bdce6f3](https://github.com/atSCM/atscm-cli/commits/bdce6f3)), closes [#5](https://github.com/atSCM/atscm-cli/issues/5)
* Update atscm by running `atscm update` ([6adfa60](https://github.com/atSCM/atscm-cli/commits/6adfa60))




<a name="0.2.2"></a>
## 0.2.2 (2017-03-15)


### Bug Fixes

* **Logger:** Use windows-friendly stdout API ([2693bbd](https://github.com/atSCM/atscm-cli/commits/2693bbd))
* **test:** Use windows-friendly paths ([3ff7018](https://github.com/atSCM/atscm-cli/commits/3ff7018))




<a name="0.2.1"></a>
## 0.2.1 (2017-03-13)


### Bug Fixes

* **Logger:** Print as single message ([a251179](https://github.com/atSCM/atscm-cli/commits/a251179))




<a name="0.2.0"></a>
# 0.2.0 (2017-03-13)


### Features

* **Logger:** Ignore empty lines when using #pipeLastLine ([f3d34cc](https://github.com/atSCM/atscm-cli/commits/f3d34cc))
* **Logger:** Print to own Console instance ([b77c0eb](https://github.com/atSCM/atscm-cli/commits/b77c0eb))




<a name="0.1.2"></a>
## 0.1.2 (2017-02-22)


### Bug Fixes

* **test:** Fixed invalid test paths ([055edf5](https://github.com/atSCM/atscm-cli/commits/055edf5))




<a name="0.1.1"></a>
## 0.1.1 (2017-02-21)




<a name="0.1.0"></a>
# 0.1.0 (2017-02-21)



