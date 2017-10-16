const Response = require('../wire/Response')
const BSON = require('../bson')
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

module.exports = jobs => data => {
    var res = new Response(bson, data)
    res.parse()
    if (jobs[res.responseTo]) {
        jobs[res.responseTo].cb.call(null, null, res)
        delete jobs[res.responseTo]
    }
}
