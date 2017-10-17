const { createConnection } = require('net')
const parse = require('parse-mongo-url')

const { curry, range, queue } = require('../utils')
const makeConnection = require('./makeConnection')
const makeTunnel = require('./tunnel')
const makeAllocator = require('./allocator')
const makeLazy = require('./makeLazy')
const makeLazyConnector = require('./makeLazyConnector')
const makeConnectionId = require('./makeConnectionId')

module.exports = ({ opt, url }) => {
    let free = null

    const q = queue()
    const pool = {}
    const allocations = {}
    const urlOpt = parse(url)
    const makeId = makeConnectionId(Date.now())
    const poolSize = Math.max(1, parseInt(typeof opt.pool === 'number' ? opt.pool : 1))

    // tunnel for responses
    const allocator = curry(makeAllocator)(opt, pool, allocations, q, id => {
        if (allocations[id]) {
            allocations[id].cb.call(null, new Error('Request timed out'))
            delete allocations[id]
            q.length ? allocator(id) : (pool[id].free = free = Boolean(id))
        }
    })
    const done = id => (q.length ? allocator(id) : (pool[id].free = free = Boolean(id)))
    const tunnel = curry(makeTunnel)(allocations, done)

    // pool
    const makeContext = curry(makeConnection)(urlOpt.servers[0], makeId, tunnel, createConnection)
    if (opt.eager) {
        range(poolSize)
            .map(makeContext)
            .reduce((acc, ctx) => (acc[ctx.id] = ctx && ctx), pool)
    }

    const lazy = curry(makeLazy)(pool, makeContext, poolSize)
    const attemptAllocation = opt.eager
        ? () => {
              return free
                  ? allocator(free) || true
                  : Object.keys(pool).reduce((allocated, id) => {
                        if (!allocated && pool[id].free) {
                            allocated = allocator(id) || true
                        }
                        return allocated
                    }, false)
          }
        : curry(makeLazyConnector)(pool, lazy, allocator)

    const queueAllocationAttempt = () => {
        const int = setInterval(() => {
            if (attemptAllocation()) {
                clearInterval(int)
            }
        }, 1)
    }
    q.on('new job', queueAllocationAttempt)

    return (req, res) => q.push({ req, res })
}
