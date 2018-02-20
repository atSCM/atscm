'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _validateNpmPackageName = require('validate-npm-package-name');

var _validateNpmPackageName2 = _interopRequireDefault(_validateNpmPackageName);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A static class containing validators for the options used when running "atscm init".
 */
class InitOptionsValidator {

  /**
   * Validates a project name to be a valid npm package name.
   * @param {string} value The name to validate.
   * @return {Boolean|String} Returns true if `value` is a valid npm package name, or an error
   * message otherwise.
   */
  static name(value) {
    const result = (0, _validateNpmPackageName2.default)(value);

    if (result.errors) {
      return result.errors[0];
    }

    // First letter must be a letter
    if (value.match(/^[a-z]+/i) === null) {
      return 'name must start with a letter';
    }

    return result.validForNewPackages ? true : result.warnings[0];
  }

}
exports.default = InitOptionsValidator;
//# sourceMappingURL=OptionsValidator.js.map