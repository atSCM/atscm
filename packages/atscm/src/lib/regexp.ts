export const specialChars = ['[', '\\', '^', '$', '.', '|', '?', '*', '+', '(', ')', ']'];

export const specialCharsRegExp = new RegExp(
  `(${specialChars.map((c) => `\\${c}`).join('|')})`,
  'g'
);

export function escapeForRegExp(source: string) {
  return source.replace(specialCharsRegExp, '\\$1');
}
