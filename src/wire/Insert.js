const CODES = require('./codes')
var MongoError = require('../error')

var Insert = function(requestId, ismaster, bson, ns, documents, options) {
    // Basic options needed to be passed in
    if (ns == null) {
        throw new MongoError('ns must be specified for query')
    }
    if (!Array.isArray(documents) || !documents.length === 0) {
        throw new MongoError('documents array must contain at least one document to insert')
    }

    // Validate that we are not passing 0x00 in the collection name
    if (!!~ns.indexOf('\x00')) {
        throw new MongoError('namespace cannot contain a null character')
    }

    // Set internal
    this.requestId = requestId
    this.bson = bson
    this.ns = ns
    this.documents = documents
    this.ismaster = ismaster

    // Ensure empty options
    options = options || {}

    // Unpack options
    this.serializeFunctions = typeof options.serializeFunctions == 'boolean' ? options.serializeFunctions : false
    this.ignoreUndefined = typeof options.ignoreUndefined == 'boolean' ? options.ignoreUndefined : false
    this.checkKeys = typeof options.checkKeys == 'boolean' ? options.checkKeys : true
    this.continueOnError = typeof options.continueOnError == 'boolean' ? options.continueOnError : false
    // Set flags
    this.flags = this.continueOnError ? 1 : 0
}

// To Binary
Insert.prototype.toBinary = function() {
    // Contains all the buffers to be written
    var buffers = []

    // Header buffer
    var header = new Buffer(
        4 * 4 + // Header
        4 + // Flags
            Buffer.byteLength(this.ns) +
            1 // namespace
    )

    // Add header to buffers
    buffers.push(header)

    // Total length of the message
    var totalLength = header.length

    // Serialize all the documents
    for (var i = 0; i < this.documents.length; i++) {
        var buffer = this.bson.serialize(this.documents[i], {
            checkKeys: this.checkKeys,
            serializeFunctions: this.serializeFunctions,
            ignoreUndefined: this.ignoreUndefined
        })

        // Document is larger than maxBsonObjectSize, terminate serialization
        if (buffer.length > this.ismaster.maxBsonObjectSize) {
            throw new MongoError(
                'Document exceeds maximum allowed bson size of ' + this.ismaster.maxBsonObjectSize + ' bytes'
            )
        }

        // Add to total length of wire protocol message
        totalLength = totalLength + buffer.length
        // Add to buffer
        buffers.push(buffer)
    }

    // Command is larger than maxMessageSizeBytes terminate serialization
    if (totalLength > this.ismaster.maxMessageSizeBytes) {
        throw new MongoError('Command exceeds maximum message size of ' + this.ismaster.maxMessageSizeBytes + ' bytes')
    }

    // Add all the metadata
    let index = 0

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
    header[index + 3] = (CODES.OP_INSERT >> 24) & 0xff
    header[index + 2] = (CODES.OP_INSERT >> 16) & 0xff
    header[index + 1] = (CODES.OP_INSERT >> 8) & 0xff
    header[index] = CODES.OP_INSERT & 0xff
    index = index + 4

    // Flags
    header[index + 3] = (this.flags >> 24) & 0xff
    header[index + 2] = (this.flags >> 16) & 0xff
    header[index + 1] = (this.flags >> 8) & 0xff
    header[index] = this.flags & 0xff
    index = index + 4

    // Write collection name
    index = index + header.write(this.ns, index, 'utf8') + 1
    header[index - 1] = 0

    // Return the buffers
    return buffers
}

module.exports = Insert
