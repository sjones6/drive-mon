const { createConnection } = require('net')
const makeQueue = require('../queue')

const range = x => Array.apply(null, Array(x)).map((_, i) => i)

module.exports = opt => {
    const queue = makeQueue()

    const allocations = {}
    const pool = {}
    const poolSize = parseInt(opt.pool) || 1

    const pipeOut = (id, data) => {
        if (allocations[id]) {
            allocations[id].call(null, data)
            delete allocations[id]
            pool[id].free = true
        }

        if (queue.length) {
            attemptAllocation()
        }
    }

    //if (opt.eager) {
        range(5).forEach(i => {
            const id = `${Date.now()}_${i}`
            const connection = createConnection(opt)
            const details = {
                id,
                ready: false,
                free: false,
                connection
            }
            connection.on('connect', () => {
                details.ready = true
                details.free = true
            })
            connection.on('data', data => pipeOut(id, data))
            pool[id] = details
        })
    //}

    const allocateNext = id => {
        var job = queue.shift()
        pool[id].free = false
        allocations[id] = job.res
        job.req(pool[id].connection)
    }

    const attemptAllocation = () => {
        return Object.keys(pool).reduce((allocated, id) => {
            if (!allocated && pool[id].free) {
                allocateNext(id)
                return true
            }
            return allocated || false
        }, false)
    }

    const queueAllocationAttempt = () => {
        const int = setInterval(() => {
            if (attemptAllocation()) {
                clearInterval(int);
            }
        }, 1)
    }
    queue.on('new job', queueAllocationAttempt)

    return {
        obtain: (req, res) => queue.push({ req, res })
    }
}
