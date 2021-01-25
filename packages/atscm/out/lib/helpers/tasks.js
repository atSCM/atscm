"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleTaskError = handleTaskError;
exports.finishTask = finishTask;

var _codeFrame = require("@babel/code-frame");

var _Session = _interopRequireDefault(require("../server/Session"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Adds additional infomation to the error's message and rethows it.
 * @param {Error} error The error that occured.
 * @throws {Error} The extended error.
 */
function handleTaskError(error) {
  if (error.location && error.rawLines) {
    error.originalStack = error.stack; // eslint-disable-line no-param-reassign
    // eslint-disable-next-line no-param-reassign

    error.stack = `${error.message}
${(0, _codeFrame.codeFrameColumns)(error.rawLines, error.location, {
      message: error.message
    })}`;
  }

  const additionalMessage = error.node ? `
 - Node: ${error.node.nodeId}` : '';
  Object.assign(error, {
    message: `${error.message}${additionalMessage}`,
    stack: `${error.stack}${additionalMessage}`
  });
  throw error;
}
/**
 * Closes open sessions once a task is complete.
 * @return {Promise<void>} Resolved once cleanup is complete.
 */


function finishTask() {
  return _Session.default.closeOpen();
}
//# sourceMappingURL=tasks.js.map