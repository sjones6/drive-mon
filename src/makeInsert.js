const Query = require('./wire/Query')
const BSON = require('./bson')
const bson = new BSON([
    BSON.Binary,
    BSON.Code,
    BSON.DBRef,
    BSON.Decimal128,
    BSON.Double,
    BSON.Int32,
    BSON.Long,
    BSON.Map,
    BSON.MaxKey,
    BSON.MinKey,
    BSON.ObjectId,
    BSON.BSONRegExp,
    BSON.Symbol,
    BSON.Timestamp
])
const format = require('util').format

module.exports = runner => (db, query, opt, cb) => {
    const parts = db.split('.')
    const cmd = new Query(
        bson,
        format('%s.$cmd', parts[0]),
        {
            insert: parts[1],
            documents: query,
            ordered: true,
            writeConcern: {
                w: 1
            }
        },
        {
            checkKeys: true,
            numberToReturn: 1,
            numberToSkip: 0
        }
    )
    runner(cmd, cb)
}
