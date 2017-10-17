module.exports = opt => pool => allocations => queue => onTimeout => id => {
    const job = queue.shift()
    if (job) {
        pool[id].free = false
        allocations[id] = { cb: job.res }
        job.req(pool[id].connection)
        allocations[id].onTimeout = setTimeout(() => onTimeout(id), typeof opt.timeout === 'number' ? opt.timeout : 1000)
    }
}
