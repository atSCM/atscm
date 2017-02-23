'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_1if8x1arsw = function () {
  var path = '/home/ubuntu/atscm/src/lib/server/Types.js',
      hash = '77af8114f2d5b75b0fa7d018bfab54dba33137a2',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/lib/server/Types.js',
    statementMap: {
      '0': {
        start: {
          line: 7,
          column: 4
        },
        end: {
          line: 7,
          column: 76
        }
      },
      '1': {
        start: {
          line: 8,
          column: 4
        },
        end: {
          line: 8,
          column: 33
        }
      },
      '2': {
        start: {
          line: 9,
          column: 4
        },
        end: {
          line: 9,
          column: 29
        }
      },
      '3': {
        start: {
          line: 10,
          column: 4
        },
        end: {
          line: 16,
          column: 5
        }
      },
      '4': {
        start: {
          line: 11,
          column: 6
        },
        end: {
          line: 15,
          column: 7
        }
      },
      '5': {
        start: {
          line: 12,
          column: 8
        },
        end: {
          line: 12,
          column: 49
        }
      },
      '6': {
        start: {
          line: 14,
          column: 8
        },
        end: {
          line: 14,
          column: 49
        }
      },
      '7': {
        start: {
          line: 24,
          column: 4
        },
        end: {
          line: 24,
          column: 69
        }
      },
      '8': {
        start: {
          line: 34,
          column: 20
        },
        end: {
          line: 53,
          column: 1
        }
      }
    },
    fnMap: {
      '0': {
        name: '(anonymous_0)',
        decl: {
          start: {
            line: 6,
            column: 2
          },
          end: {
            line: 6,
            column: 3
          }
        },
        loc: {
          start: {
            line: 6,
            column: 70
          },
          end: {
            line: 17,
            column: 3
          }
        }
      },
      '1': {
        name: '(anonymous_1)',
        decl: {
          start: {
            line: 23,
            column: 2
          },
          end: {
            line: 23,
            column: 3
          }
        },
        loc: {
          start: {
            line: 23,
            column: 32
          },
          end: {
            line: 25,
            column: 3
          }
        }
      }
    },
    branchMap: {
      '0': {
        loc: {
          start: {
            line: 10,
            column: 4
          },
          end: {
            line: 16,
            column: 5
          }
        },
        type: 'if',
        locations: [{
          start: {
            line: 10,
            column: 4
          },
          end: {
            line: 16,
            column: 5
          }
        }, {
          start: {
            line: 10,
            column: 4
          },
          end: {
            line: 16,
            column: 5
          }
        }]
      },
      '1': {
        loc: {
          start: {
            line: 11,
            column: 6
          },
          end: {
            line: 15,
            column: 7
          }
        },
        type: 'if',
        locations: [{
          start: {
            line: 11,
            column: 6
          },
          end: {
            line: 15,
            column: 7
          }
        }, {
          start: {
            line: 11,
            column: 6
          },
          end: {
            line: 15,
            column: 7
          }
        }]
      }
    },
    s: {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
      '7': 0,
      '8': 0
    },
    f: {
      '0': 0,
      '1': 0
    },
    b: {
      '0': [0, 0],
      '1': [0, 0]
    },
    _coverageSchema: '332fd63041d2c1bcb487cc26dd0d5f7d97098a6c'
  },
      coverage = global[gcv] || (global[gcv] = {});

  if (coverage[path] && coverage[path].hash === hash) {
    return coverage[path];
  }

  coverageData.hash = hash;
  return coverage[path] = coverageData;
}();

var _nodeOpcua = require('node-opcua');

var _NodeId = require('../server/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class AtviseType {

  constructor(nodeIdValue, identifier, dataType, fileExtensionOrKeep) {
    ++cov_1if8x1arsw.f[0];
    ++cov_1if8x1arsw.s[0];

    this.typeDefinition = new _NodeId2.default(`VariableTypes.ATVISE.${nodeIdValue}`);
    ++cov_1if8x1arsw.s[1];
    this.identifier = identifier;
    ++cov_1if8x1arsw.s[2];
    this.dataType = dataType;
    ++cov_1if8x1arsw.s[3];
    if (fileExtensionOrKeep !== undefined) {
      ++cov_1if8x1arsw.b[0][0];
      ++cov_1if8x1arsw.s[4];

      if (typeof fileExtensionOrKeep === 'string') {
        ++cov_1if8x1arsw.b[1][0];
        ++cov_1if8x1arsw.s[5];

        this.fileExtension = fileExtensionOrKeep;
      } else {
        ++cov_1if8x1arsw.b[1][1];
        ++cov_1if8x1arsw.s[6];

        this.keepExtension = fileExtensionOrKeep;
      }
    } else {
      ++cov_1if8x1arsw.b[0][1];
    }
  }

}

class AtviseResourceType extends AtviseType {

  constructor(name, identifier) {
    ++cov_1if8x1arsw.f[1];
    ++cov_1if8x1arsw.s[7];

    super(`Resource.${name}`, identifier, _nodeOpcua.DataType.ByteString, true);
  }

}

/**
 * The atvise types to handle. **Ordering matters:** The {@link MappingTransformer} takes the first
 * match, therefore **plain types should always come before resource types!**
 * @type {AtviseType[]}
 */
const AtviseTypes = (++cov_1if8x1arsw.s[8], [new AtviseType('HtmlHelp', 'help', _nodeOpcua.DataType.XmlElement, 'html'), new AtviseType('QuickDynamic', 'qd', _nodeOpcua.DataType.XmlElement), new AtviseType('ScriptCode', 'script', _nodeOpcua.DataType.XmlElement), new AtviseType('Display', 'display', _nodeOpcua.DataType.XmlElement), new AtviseType('TranslationTable', 'locs', _nodeOpcua.DataType.XmlElement), new AtviseResourceType('Pdf', 'pdf'), new AtviseResourceType('Html', 'html'), new AtviseResourceType('Javascript', 'js'), new AtviseResourceType('Wave', 'wav'), new AtviseResourceType('Gif', 'gif'), new AtviseResourceType('Png', 'png'), new AtviseResourceType('Aac', 'm4a'), new AtviseResourceType('Ogg', 'ogg'), new AtviseResourceType('Icon', 'ico'), new AtviseResourceType('Css', 'css'), new AtviseResourceType('Svg', 'svg'), new AtviseResourceType('Jpeg', 'jpg'), new AtviseResourceType('OctetStream', '*')]);

exports.default = AtviseTypes;