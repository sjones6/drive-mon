const MongoError = require('../error')
const CODES = require('./codes')

var Update = function(requestId, ismaster, bson, ns, update, options) {
    // Basic options needed to be passed in
    if (ns === null || ns === undefined) {
        throw new MongoError('ns must be specified for query')
    }

    // Ensure empty options
    options = options || {}

    // Set internal
    this.requestId = requestId
    this.bson = bson
    this.ns = ns
    this.ismaster = ismaster

    // Unpack options
    this.serializeFunctions = typeof options.serializeFunctions == 'boolean' ? options.serializeFunctions : false
    this.ignoreUndefined = typeof options.ignoreUndefined == 'boolean' ? options.ignoreUndefined : false
    this.checkKeys = typeof options.checkKeys == 'boolean' ? options.checkKeys : false

    // Unpack the update document
    this.upsert = typeof update[0].upsert == 'boolean' ? update[0].upsert : false
    this.multi = typeof update[0].multi == 'boolean' ? update[0].multi : false
    this.q = update[0].q
    this.u = update[0].u

    // Create flag value
    this.flags = this.upsert ? 1 : 0
    this.flags = this.multi ? this.flags | 2 : this.flags
}

// To Binary
Update.prototype.toBinary = function() {
    // Contains all the buffers to be written
    var buffers = []

    // Header buffer
    var header = new Buffer(
        4 * 4 + // Header
        4 + // ZERO
        Buffer.byteLength(this.ns) +
        1 + // namespace
            4 // Flags
    )

    // Add header to buffers
    buffers.push(header)

    // Total length of the message
    var totalLength = header.length

    // Serialize the selector
    var selector = this.bson.serialize(this.q, {
        checkKeys: this.checkKeys,
        serializeFunctions: this.serializeFunctions,
        ignoreUndefined: this.ignoreUndefined
    })
    buffers.push(selector)
    totalLength = totalLength + selector.length

    // Serialize the update
    var update = this.bson.serialize(this.u, {
        checkKeys: this.checkKeys,
        serializeFunctions: this.serializeFunctions,
        ignoreUndefined: this.ignoreUndefined
    })
    buffers.push(update)
    totalLength = totalLength + update.length

    // Index in header buffer
    var index = 0

    // Write header length
    header[index + 3] = (totalLength >> 24) & 0xff
    header[index + 2] = (totalLength >> 16) & 0xff
    header[index + 1] = (totalLength >> 8) & 0xff
    header[index] = totalLength & 0xff
    index = index + 4

    // Write header requestId
    header[index + 3] = (this.requestId >> 24) & 0xff
    header[index + 2] = (this.requestId >> 16) & 0xff
    header[index + 1] = (this.requestId >> 8) & 0xff
    header[index] = this.requestId & 0xff
    index = index + 4

    // No flags
    header[index + 3] = (0 >> 24) & 0xff
    header[index + 2] = (0 >> 16) & 0xff
    header[index + 1] = (0 >> 8) & 0xff
    header[index] = 0 & 0xff
    index = index + 4

    // Operation
    header[index + 3] = (OP_UPDATE >> 24) & 0xff
    header[index + 2] = (OP_UPDATE >> 16) & 0xff
    header[index + 1] = (OP_UPDATE >> 8) & 0xff
    header[index] = OP_UPDATE & 0xff
    index = index + 4

    // Write ZERO
    header[index + 3] = (0 >> 24) & 0xff
    header[index + 2] = (0 >> 16) & 0xff
    header[index + 1] = (0 >> 8) & 0xff
    header[index] = 0 & 0xff
    index = index + 4

    // Write collection name
    index = index + header.write(this.ns, index, 'utf8') + 1
    header[index - 1] = 0

    // Flags
    header[index + 3] = (this.flags >> 24) & 0xff
    header[index + 2] = (this.flags >> 16) & 0xff
    header[index + 1] = (this.flags >> 8) & 0xff
    header[index] = this.flags & 0xff
    index = index + 4

    // Return the buffers
    return buffers
}

module.exports = Update
