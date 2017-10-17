module.exports = pool => lazy => allocator => () =>
    Object.keys(pool).reduce((allocated, id) => {
        if (!allocated && pool[id].free) {
            allocated = allocator(id) || true
        }
        return allocated
    }, false) ||
    (lazy() && false)
