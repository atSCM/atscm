"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateFile = updateFile;
exports.updateJson = updateJson;

var _fsExtra = require("fs-extra");

var _detectIndent = _interopRequireDefault(require("detect-indent"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function updateFile(path, update, encoding = 'utf8') {
  const contents = await (0, _fsExtra.readFile)(path, encoding);
  const updated = await update(contents);
  return (0, _fsExtra.writeFile)(path, updated);
}

async function updateJson(path, update) {
  return updateFile(path, async contents => {
    const indent = (0, _detectIndent.default)(contents).indent || '  ';
    const current = JSON.parse(contents);
    const updated = await update(current);
    return JSON.stringify(updated, null, indent);
  });
}
//# sourceMappingURL=fs.js.map