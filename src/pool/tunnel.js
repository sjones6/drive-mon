module.exports = allocations => done => (id, data) => {
    if (allocations[id]) {
        clearTimeout(allocations[id].onTimeout)
        allocations[id].cb.call(null, null, data)
        delete allocations[id]
    }
    done(id)
}
