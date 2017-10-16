var requestId = require('./requestId')
const CODES = require('./codes')

var KillCursor = function(bson, cursorIds) {
    this.requestId = requestId()
    this.cursorIds = cursorIds
}

//
// Uses a single allocated buffer for the process, avoiding multiple memory allocations
KillCursor.prototype.toBin = function() {
    var length = 4 + 4 + 4 * 4 + this.cursorIds.length * 8

    // Create command buffer
    var index = 0
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

    // index = write32bit(index, _buffer, CODES.OP_KILL_CURSORS)
    _buffer[index + 3] = (CODES.OP_KILL_CURSORS >> 24) & 0xff
    _buffer[index + 2] = (CODES.OP_KILL_CURSORS >> 16) & 0xff
    _buffer[index + 1] = (CODES.OP_KILL_CURSORS >> 8) & 0xff
    _buffer[index] = CODES.OP_KILL_CURSORS & 0xff
    index = index + 4

    // index = write32bit(index, _buffer, 0)
    _buffer[index + 3] = (0 >> 24) & 0xff
    _buffer[index + 2] = (0 >> 16) & 0xff
    _buffer[index + 1] = (0 >> 8) & 0xff
    _buffer[index] = 0 & 0xff
    index = index + 4

    // Write batch size
    // index = write32bit(index, _buffer, this.cursorIds.length)
    _buffer[index + 3] = (this.cursorIds.length >> 24) & 0xff
    _buffer[index + 2] = (this.cursorIds.length >> 16) & 0xff
    _buffer[index + 1] = (this.cursorIds.length >> 8) & 0xff
    _buffer[index] = this.cursorIds.length & 0xff
    index = index + 4

    // Write all the cursor ids into the array
    for (var i = 0; i < this.cursorIds.length; i++) {
        // Write cursor id
        // index = write32bit(index, _buffer, cursorIds[i].getLowBits())
        _buffer[index + 3] = (this.cursorIds[i].getLowBits() >> 24) & 0xff
        _buffer[index + 2] = (this.cursorIds[i].getLowBits() >> 16) & 0xff
        _buffer[index + 1] = (this.cursorIds[i].getLowBits() >> 8) & 0xff
        _buffer[index] = this.cursorIds[i].getLowBits() & 0xff
        index = index + 4

        // index = write32bit(index, _buffer, cursorIds[i].getHighBits())
        _buffer[index + 3] = (this.cursorIds[i].getHighBits() >> 24) & 0xff
        _buffer[index + 2] = (this.cursorIds[i].getHighBits() >> 16) & 0xff
        _buffer[index + 1] = (this.cursorIds[i].getHighBits() >> 8) & 0xff
        _buffer[index] = this.cursorIds[i].getHighBits() & 0xff
        index = index + 4
    }

    // Return buffer
    return _buffer
}
