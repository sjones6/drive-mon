const { pipe } = require('../utils')

module.exports = opt => makeId => tunnel => createConnection => id =>
    pipe(
        ctx => {
            ctx.connection = createConnection(opt)
            return ctx
        },
        ctx => {
            ctx.connection.on('connect', () =>
                Object.assign(ctx, {
                    ready: true,
                    free: true
                })
            )
            return ctx
        },
        ctx => {
            ctx.connection.on('data', data => {
                tunnel(makeId(id), data)
            })
            return ctx
        }
    )({
        id: makeId(id),
        ready: false,
        free: false
    })
