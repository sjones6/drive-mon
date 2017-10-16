const retrieveBSON = function() {
    var BSON = require('bson')
    BSON.native = false

    try {
        var optionalBSON = require('bson-ext')
        if (optionalBSON) {
            optionalBSON.native = true
            return optionalBSON
        }
    } catch (err) {}

    return BSON
}

module.exports = {
    retrieveBSON
}
