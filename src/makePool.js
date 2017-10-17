const { pipe } = require('./utils')
const makePool = require('./pool/make')

module.exports = x =>
    pipe(makePool, pool => (req, res) =>
        pool(connection => {
            const toWrite = req()
            if (Array.isArray(toWrite)) {
                toWrite.forEach(bit => connection.write(bit))
            } else {
                connection.write(toWrite)
            }
        }, res)
    )(x)
