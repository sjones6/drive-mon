const EventEmitter = require('events')

module.exports = () => {
    const jobs = []
    const queue = new EventEmitter()

    // Push & Pop
    queue.push = (...x) => {
        jobs.push.apply(jobs, x)
        queue.emit('new job')
    }
    queue.shift = () => jobs.shift()

    // State
    Object.defineProperty(queue, 'empty', {
        get: () => jobs.length === 0,
        set: () => {}
    })

    return queue
}
