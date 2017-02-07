import validatePackageName from 'validate-npm-package-name';

/**
 * A static class containing validators for the options used when running "atscm init".
 */
export default class InitOptionsValidator {

  /**
   * Validates a project name to be a valid npm package name.
   * @param {String} value The name to validate.
   * @return {Boolean|String} Returns true if `value` is a valid npm package name, or an error
   * message otherwise.
   */
  static name(value) {
    const result = validatePackageName(value);

    if (result.validForNewPackages) { return true; }

    if (result.errors) { return result.errors[0]; }

    return result.warnings[0];
  }

}
