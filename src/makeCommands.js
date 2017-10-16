const makeFind = require('./makeFind')
const makeInsert = require('./makeInsert')
const makeUpdate = require('./makeUpdate')
const makeRemove = require('./makeRemove')

module.exports = runner => ({
    find: makeFind(runner),
    insert: makeInsert(runner),
    update: makeUpdate(runner),
    remove: makeRemove(runner)
})
