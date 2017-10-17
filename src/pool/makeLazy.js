let count = 0
module.exports = pool => makeContext => poolSize => () => {
    if (Object.keys(pool).length < poolSize) {
        const ctx = makeContext(count++)
        pool[ctx.id] = ctx
    }
}
