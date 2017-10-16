const requestId = require('./requestId')
const CODES = require('./codes')

var GetMore = function(bson, ns, cursorId, opts) {
    opts = opts || {}
    this.numberToReturn = opts.numberToReturn || 0
    this.requestId = _requestId++
    this.bson = bson
    this.ns = ns
    this.cursorId = cursorId
}

//
// Uses a single allocated buffer for the process, avoiding multiple memory allocations
GetMore.prototype.toBinary = function() {
    var length = 4 + Buffer.byteLength(this.ns) + 1 + 4 + 8 + 4 * 4
    // Create command buffer
    var index = 0
    // Allocate buffer
    var _buffer = new Buffer(length)

    // Write header information
    // index = write32bit(index, _buffer, length)
    _buffer[index + 3] = (length >> 24) & 0xff
    _buffer[index + 2] = (length >> 16) & 0xff
    _buffer[index + 1] = (length >> 8) & 0xff
    _buffer[index] = length & 0xff
    index = index + 4

    // index = write32bit(index, _buffer, requestId)
    _buffer[index + 3] = (this.requestId >> 24) & 0xff
    _buffer[index + 2] = (this.requestId >> 16) & 0xff
    _buffer[index + 1] = (this.requestId >> 8) & 0xff
    _buffer[index] = this.requestId & 0xff
    index = index + 4

    // index = write32bit(index, _buffer, 0)
    _buffer[index + 3] = (0 >> 24) & 0xff
    _buffer[index + 2] = (0 >> 16) & 0xff
    _buffer[index + 1] = (0 >> 8) & 0xff
    _buffer[index] = 0 & 0xff
    index = index + 4

    // index = write32bit(index, _buffer, CODES.OP_GETMORE)
    _buffer[index + 3] = (CODES.OP_GETMORE >> 24) & 0xff
    _buffer[index + 2] = (CODES.OP_GETMORE >> 16) & 0xff
    _buffer[index + 1] = (CODES.OP_GETMORE >> 8) & 0xff
    _buffer[index] = CODES.OP_GETMORE & 0xff
    index = index + 4

    // index = write32bit(index, _buffer, 0)
    _buffer[index + 3] = (0 >> 24) & 0xff
    _buffer[index + 2] = (0 >> 16) & 0xff
    _buffer[index + 1] = (0 >> 8) & 0xff
    _buffer[index] = 0 & 0xff
    index = index + 4

    // Write collection name
    index = index + _buffer.write(this.ns, index, 'utf8') + 1
    _buffer[index - 1] = 0

    // Write batch size
    // index = write32bit(index, _buffer, numberToReturn)
    _buffer[index + 3] = (this.numberToReturn >> 24) & 0xff
    _buffer[index + 2] = (this.numberToReturn >> 16) & 0xff
    _buffer[index + 1] = (this.numberToReturn >> 8) & 0xff
    _buffer[index] = this.numberToReturn & 0xff
    index = index + 4

    // Write cursor id
    // index = write32bit(index, _buffer, cursorId.getLowBits())
    _buffer[index + 3] = (this.cursorId.getLowBits() >> 24) & 0xff
    _buffer[index + 2] = (this.cursorId.getLowBits() >> 16) & 0xff
    _buffer[index + 1] = (this.cursorId.getLowBits() >> 8) & 0xff
    _buffer[index] = this.cursorId.getLowBits() & 0xff
    index = index + 4

    // index = write32bit(index, _buffer, cursorId.getHighBits())
    _buffer[index + 3] = (this.cursorId.getHighBits() >> 24) & 0xff
    _buffer[index + 2] = (this.cursorId.getHighBits() >> 16) & 0xff
    _buffer[index + 1] = (this.cursorId.getHighBits() >> 8) & 0xff
    _buffer[index] = this.cursorId.getHighBits() & 0xff
    index = index + 4

    // Return buffer
    return _buffer
}

module.exports = GetMore
