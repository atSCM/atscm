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
    static name(value: string): string | boolean;
}
