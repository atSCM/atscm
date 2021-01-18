/** Special characters in regular expressions. */
export const specialChars = ['[', '\\', '^', '$', '.', '|', '?', '*', '+', '(', ')', ']'];

/** A regular expression that matches all special characters in regular expressions. */
export const specialCharsRegExp = new RegExp(
  `(${specialChars.map((c) => `\\${c}`).join('|')})`,
  'g'
);

/**
 * Returns a string with all special regular expression characters escaped.
 * @param source The string to escape.
 */
export function escapeForRegExp(source: string) {
  return source.replace(specialCharsRegExp, '\\$1');
}
