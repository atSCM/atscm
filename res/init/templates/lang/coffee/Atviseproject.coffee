{ Atviseproject } = require 'atscm'

###*
 * atvise-scm configuration of {{name}}.
###
class {{pascalcase name}} extends Atviseproject

  ###*
   * The atvise-server's host
   * @type {String}
  ###
  @host: '{{atviseHost}}'

  ###*
   * The atvise-server ports to use.
   * @type {Object}
   * @property {Number} opc The OPC-UA port the atvise-server runs on.
   * @property {Number} http The HTTP port the atvise-server can be reached at.
  ###
  @port:
    opc: 4840
    http: 80

module.exports =
  default: {{pascalcase name}}
