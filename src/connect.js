const pipe = require('./pipe')
const parse = require('parse-mongo-url')
const makePool = require('./makePool')
const makeRunner = require('./makeRunner')
const makeCommands = require('./makeCommands')

module.exports = (url = 'localhost:27017', opt = {}) => pipe(makePool, makeRunner, makeCommands)({ url, opt })
