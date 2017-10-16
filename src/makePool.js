const makePool = require('./pool/make')

module.exports = opt => {
    const pool = makePool(opt)

    return (req, res) =>
        pool.obtain(connection => {
            const toWrite = req()
            if (Array.isArray(toWrite)) {
                toWrite.forEach(bit => connection.write(bit))
            } else {
                connection.write(toWrite)
            }
        }, res)
}
