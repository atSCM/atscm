import validatePackageName from 'validate-npm-package-name';

/**
 * A static class containing validators for the options used when running "atscm init".
 */
export default class InitOptionsValidator {

  /**
   * Validates a project name to be a valid npm package name.
   * @param {string} value The name to validate.
   * @return {boolean|string} Returns true if `value` is a valid npm package name, or an error
   * message otherwise.
   */
  static name(value) {
    const result = validatePackageName(value);

    if (result.errors) { return result.errors[0]; }

    // First letter must be a letter
    if (value.match(/^@?[a-z]+/i) === null) {
      return 'name must start with a letter';
    }

    if (value === 'atscm') {
      return "'atscm' is not allowed";
    }

    return result.validForNewPackages ? true : result.warnings[0];
  }

}
