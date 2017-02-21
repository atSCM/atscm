'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _validateNpmPackageName = require('validate-npm-package-name');

var _validateNpmPackageName2 = _interopRequireDefault(_validateNpmPackageName);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class InitOptionsValidator {

  static name(value) {
    const result = (0, _validateNpmPackageName2.default)(value);

    if (result.validForNewPackages) {
      return true;
    }

    if (result.errors) {
      return result.errors[0];
    }

    return result.warnings[0];
  }

}

exports.default = InitOptionsValidator; /* export function name(value) {
                                          const result = validatePackageName(value);
                                        
                                          if (result.validForNewPackages) { return true; }
                                        
                                          if (result.errors) { return result.errors[0]; }
                                        
                                          return result.warnings[0];
                                        } */