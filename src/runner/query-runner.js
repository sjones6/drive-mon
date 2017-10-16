const makeQueue = require('../queue')

module.exports = pool => {
    const queue = makeQueue()

    queue.on('new job', () => {
        const cmd = queue.shift()
        pool(() => cmd.query.toBinary(), cmd.cb)
    })

    return (query, cb) => {
        queue.push({
            query,
            cb
        })
    }
}
