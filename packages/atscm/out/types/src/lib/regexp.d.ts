/** Special characters in regular expressions. */
export declare const specialChars: string[];
/** A regular expression that matches all special characters in regular expressions. */
export declare const specialCharsRegExp: RegExp;
/**
 * Returns a string with all special regular expression characters escaped.
 * @param source The string to escape.
 */
export declare function escapeForRegExp(source: string): string;
