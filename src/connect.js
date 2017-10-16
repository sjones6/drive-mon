const pipe = require('./pipe')
const parse = require('parse-mongo-url')
const makePool = require('./makePool')
const makeRunner = require('./makeRunner')
const makeCommands = require('./makeCommands')

module.exports = (url, opt = {}) => pipe(makePool, makeRunner, makeCommands)(parse(url).servers[0])
