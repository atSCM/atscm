'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_1oi9oh1xds = function () {
  var path = '/home/ubuntu/atscm/src/lib/transform/XMLTransformer.js',
      hash = '37a24187f254f9e0d6324b1ca2dd214f456275c0',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/lib/transform/XMLTransformer.js',
    statementMap: {
      '0': {
        start: {
          line: 14,
          column: 4
        },
        end: {
          line: 14,
          column: 19
        }
      },
      '1': {
        start: {
          line: 20,
          column: 4
        },
        end: {
          line: 20,
          column: 59
        }
      },
      '2': {
        start: {
          line: 26,
          column: 4
        },
        end: {
          line: 38,
          column: 7
        }
      },
      '3': {
        start: {
          line: 46,
          column: 4
        },
        end: {
          line: 48,
          column: 34
        }
      },
      '4': {
        start: {
          line: 58,
          column: 4
        },
        end: {
          line: 58,
          column: 38
        }
      },
      '5': {
        start: {
          line: 68,
          column: 4
        },
        end: {
          line: 72,
          column: 5
        }
      },
      '6': {
        start: {
          line: 69,
          column: 6
        },
        end: {
          line: 69,
          column: 55
        }
      },
      '7': {
        start: {
          line: 71,
          column: 6
        },
        end: {
          line: 71,
          column: 18
        }
      }
    },
    fnMap: {
      '0': {
        name: '(anonymous_0)',
        decl: {
          start: {
            line: 13,
            column: 2
          },
          end: {
            line: 13,
            column: 3
          }
        },
        loc: {
          start: {
            line: 13,
            column: 23
          },
          end: {
            line: 39,
            column: 3
          }
        }
      },
      '1': {
        name: '(anonymous_1)',
        decl: {
          start: {
            line: 45,
            column: 2
          },
          end: {
            line: 45,
            column: 3
          }
        },
        loc: {
          start: {
            line: 45,
            column: 16
          },
          end: {
            line: 49,
            column: 3
          }
        }
      },
      '2': {
        name: '(anonymous_2)',
        decl: {
          start: {
            line: 57,
            column: 2
          },
          end: {
            line: 57,
            column: 3
          }
        },
        loc: {
          start: {
            line: 57,
            column: 33
          },
          end: {
            line: 59,
            column: 3
          }
        }
      },
      '3': {
        name: '(anonymous_3)',
        decl: {
          start: {
            line: 67,
            column: 2
          },
          end: {
            line: 67,
            column: 3
          }
        },
        loc: {
          start: {
            line: 67,
            column: 35
          },
          end: {
            line: 73,
            column: 3
          }
        }
      }
    },
    branchMap: {
      '0': {
        loc: {
          start: {
            line: 46,
            column: 11
          },
          end: {
            line: 48,
            column: 33
          }
        },
        type: 'cond-expr',
        locations: [{
          start: {
            line: 47,
            column: 6
          },
          end: {
            line: 47,
            column: 25
          }
        }, {
          start: {
            line: 48,
            column: 6
          },
          end: {
            line: 48,
            column: 33
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
      '7': 0
    },
    f: {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0
    },
    b: {
      '0': [0, 0]
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

var _xml2js = require('xml2js');

var _Transformer = require('./Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A transformer used to transform XML documents.
 */
class XMLTransformer extends _Transformer2.default {

  /**
   * Creates a new XMLTransformer based on some options.
   * @param {Object} options The options to use.
   */
  constructor(options) {
    ++cov_1oi9oh1xds.f[0];
    ++cov_1oi9oh1xds.s[0];

    super(options);

    /**
     * The builder to use with direction {@link TransformDirection.FromDB}.
     * @type {xml2js~Builder}
     */
    ++cov_1oi9oh1xds.s[1];
    this._fromDBBuilder = new _xml2js.Builder({ cdata: false });

    /**
     * The builder to use with direction {@link TransformDirection.FromFilesystem}.
     * @type {xml2js~Builder}
     */
    ++cov_1oi9oh1xds.s[2];
    this._fromFilesystemBuilder = new _xml2js.Builder({
      renderOpts: {
        pretty: true,
        indent: ' ',
        newline: '\r\n'
      },
      xmldec: {
        version: '1.0',
        encoding: 'UTF-8',
        standalone: false
      },
      cdata: false
    });
  }

  /**
   * Returns the XML builder instance to use base on the current {@link Transformer#direction}.
   * @type {xml2js~Builder}
   */
  get builder() {
    ++cov_1oi9oh1xds.f[1];
    ++cov_1oi9oh1xds.s[3];

    return this.direction === _Transformer.TransformDirection.FromDB ? (++cov_1oi9oh1xds.b[0][0], this._fromDBBuilder) : (++cov_1oi9oh1xds.b[0][1], this._fromFilesystemBuilder);
  }

  /**
   * Parses XML in a file's contents.
   * @param {AtviseFile} file The file to process.
   * @param {function(err: ?Error, result: ?Object)} callback Called with the parsed document or the
   * parse error that occurred.
   */
  decodeContents(file, callback) {
    ++cov_1oi9oh1xds.f[2];
    ++cov_1oi9oh1xds.s[4];

    (0, _xml2js.parseString)(file.contents, callback);
  }

  /**
   * Builds an XML string from an object.
   * @param {Object} object The object to encode.
   * @param {function(err: ?Error, result: ?String)} callback Called with the resulting string or
   * the error that occurred while building.
   */
  encodeContents(object, callback) {
    ++cov_1oi9oh1xds.f[3];
    ++cov_1oi9oh1xds.s[5];

    try {
      ++cov_1oi9oh1xds.s[6];

      callback(null, this.builder.buildObject(object));
    } catch (e) {
      ++cov_1oi9oh1xds.s[7];

      callback(e);
    }
  }

}
exports.default = XMLTransformer;