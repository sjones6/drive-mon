const { Long } = require('../bson')
const CODES = require('./codes')

var Response = function(bson, data, opts) {
    opts = opts || { promoteLongs: true, promoteValues: true, promoteBuffers: false }
    this.parsed = false

    // Parse Header
    this.index = 0
    this.raw = data
    this.data = data
    this.bson = bson
    this.opts = opts

    // Read the message length
    this.length =
        data[this.index] | (data[this.index + 1] << 8) | (data[this.index + 2] << 16) | (data[this.index + 3] << 24)
    this.index = this.index + 4

    // Fetch the request id for this reply
    this.requestId =
        data[this.index] | (data[this.index + 1] << 8) | (data[this.index + 2] << 16) | (data[this.index + 3] << 24)
    this.index = this.index + 4

    // Fetch the id of the request that triggered the response
    this.responseTo =
        data[this.index] | (data[this.index + 1] << 8) | (data[this.index + 2] << 16) | (data[this.index + 3] << 24)
    this.index = this.index + 4

    // Skip op-code field
    this.index = this.index + 4

    // Unpack flags
    this.responseFlags =
        data[this.index] | (data[this.index + 1] << 8) | (data[this.index + 2] << 16) | (data[this.index + 3] << 24)
    this.index = this.index + 4

    // Unpack the cursor
    var lowBits =
        data[this.index] | (data[this.index + 1] << 8) | (data[this.index + 2] << 16) | (data[this.index + 3] << 24)
    this.index = this.index + 4
    var highBits =
        data[this.index] | (data[this.index + 1] << 8) | (data[this.index + 2] << 16) | (data[this.index + 3] << 24)
    this.index = this.index + 4
    // Create long object
    this.cursorId = new Long(lowBits, highBits)

    // Unpack the starting from
    this.startingFrom =
        data[this.index] | (data[this.index + 1] << 8) | (data[this.index + 2] << 16) | (data[this.index + 3] << 24)
    this.index = this.index + 4

    // Unpack the number of objects returned
    this.numberReturned =
        data[this.index] | (data[this.index + 1] << 8) | (data[this.index + 2] << 16) | (data[this.index + 3] << 24)
    this.index = this.index + 4

    // Preallocate document array
    this.documents = new Array(this.numberReturned)

    // Flag values
    this.cursorNotFound = (this.responseFlags & CODES.CURSOR_NOT_FOUND) != 0
    this.queryFailure = (this.responseFlags & CODES.QUERY_FAILURE) != 0
    this.shardConfigStale = (this.responseFlags & CODES.SHARD_CONFIG_STALE) != 0
    this.awaitCapable = (this.responseFlags & CODES.AWAIT_CAPABLE) != 0
    this.promoteLongs = typeof opts.promoteLongs == 'boolean' ? opts.promoteLongs : true
    this.promoteValues = typeof opts.promoteValues == 'boolean' ? opts.promoteValues : true
    this.promoteBuffers = typeof opts.promoteBuffers == 'boolean' ? opts.promoteBuffers : false
}

Response.prototype.isParsed = function() {
    return this.parsed
}

Response.prototype.parse = function(options) {
    // Safeguard
    if (this.parsed) {
        return
    }
    options = options || {}

    // Allow the return of raw documents instead of parsing
    var raw = options.raw || false
    var documentsReturnedIn = options.documentsReturnedIn || null
    var promoteLongs = typeof options.promoteLongs == 'boolean' ? options.promoteLongs : this.opts.promoteLongs
    var promoteValues = typeof options.promoteValues == 'boolean' ? options.promoteValues : this.opts.promoteValues
    var promoteBuffers = typeof options.promoteBuffers == 'boolean' ? options.promoteBuffers : this.opts.promoteBuffers
    var bsonSize, _options

    // Set up the options
    _options = {
        promoteLongs: promoteLongs,
        promoteValues: promoteValues,
        promoteBuffers: promoteBuffers
    }

    // Single document and documentsReturnedIn set
    if (this.numberReturned == 1 && documentsReturnedIn != null && raw) {
        // Calculate the bson size
        bsonSize =
            this.data[this.index] |
            (this.data[this.index + 1] << 8) |
            (this.data[this.index + 2] << 16) |
            (this.data[this.index + 3] << 24)

        // Slice out the buffer containing the command result document
        var document = this.data.slice(this.index, this.index + bsonSize)

        // Set up field we wish to keep as raw
        var fieldsAsRaw = {}
        fieldsAsRaw[documentsReturnedIn] = true
        _options.fieldsAsRaw = fieldsAsRaw

        // Deserialize but keep the array of documents in non-parsed form
        var doc = this.bson.deserialize(document, _options)

        // Get the documents
        this.documents = doc.cursor[documentsReturnedIn]
        this.numberReturned = this.documents.length

        // Ensure we have a Long valie cursor id
        this.cursorId = typeof doc.cursor.id == 'number' ? Long.fromNumber(doc.cursor.id) : doc.cursor.id

        // Adjust the index
        this.index = this.index + bsonSize

        // Set as parsed
        this.parsed = true
        return
    }

    // Parse Body
    for (var i = 0; i < this.numberReturned; i++) {
        bsonSize =
            this.data[this.index] |
            (this.data[this.index + 1] << 8) |
            (this.data[this.index + 2] << 16) |
            (this.data[this.index + 3] << 24)

        // If we have raw results specified slice the return document
        if (raw) {
            this.documents[i] = this.data.slice(this.index, this.index + bsonSize)
        } else {
            this.documents[i] = this.bson.deserialize(this.data.slice(this.index, this.index + bsonSize), _options)
        }

        // Adjust the index
        this.index = this.index + bsonSize
    }

    // Set parsed
    this.parsed = true
}

module.exports = Response
