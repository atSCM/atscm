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

  {{#if useLogin}}
  ###*
   * The login to use. Return `false` if no login is required.
   * @type {Boolean|Object}
   * @property {String} username The username to log in with.
   * @property {String} password The password to log in with.
  ###
  @login:
    username: '{{atviseUser}}'
    password: '{{atvisePasssword}}'

module.exports =
  default: {{pascalcase name}}
