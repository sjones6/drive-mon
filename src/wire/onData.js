module.exports = function(self) {
    return function(data) {
        // Parse until we are done with the data
        while (data.length > 0) {
            // If we still have bytes to read on the current message
            if (self.bytesRead > 0 && self.sizeOfMessage > 0) {
                // Calculate the amount of remaining bytes
                var remainingBytesToRead = self.sizeOfMessage - self.bytesRead
                // Check if the current chunk contains the rest of the message
                if (remainingBytesToRead > data.length) {
                    // Copy the new data into the exiting buffer (should have been allocated when we know the message size)
                    data.copy(self.buffer, self.bytesRead)
                    // Adjust the number of bytes read so it point to the correct index in the buffer
                    self.bytesRead = self.bytesRead + data.length

                    // Reset state of buffer
                    data = new Buffer(0)
                } else {
                    // Copy the missing part of the data into our current buffer
                    data.copy(self.buffer, self.bytesRead, 0, remainingBytesToRead)
                    // Slice the overflow into a new buffer that we will then re-parse
                    data = data.slice(remainingBytesToRead)

                    // Emit current complete message
                    try {
                        var emitBuffer = self.buffer
                        // Reset state of buffer
                        self.buffer = null
                        self.sizeOfMessage = 0
                        self.bytesRead = 0
                        self.stubBuffer = null
                        // Emit the buffer
                        self.messageHandler(new Response(self.bson, emitBuffer, self.responseOptions), self)
                    } catch (err) {
                        var errorObject = {
                            err: 'socketHandler',
                            trace: err,
                            bin: self.buffer,
                            parseState: {
                                sizeOfMessage: self.sizeOfMessage,
                                bytesRead: self.bytesRead,
                                stubBuffer: self.stubBuffer
                            }
                        }
                        // We got a parse Error fire it off then keep going
                        self.emit('parseError', errorObject, self)
                    }
                }
            } else {
                // Stub buffer is kept in case we don't get enough bytes to determine the
                // size of the message (< 4 bytes)
                if (self.stubBuffer != null && self.stubBuffer.length > 0) {
                    // If we have enough bytes to determine the message size let's do it
                    if (self.stubBuffer.length + data.length > 4) {
                        // Prepad the data
                        var newData = new Buffer(self.stubBuffer.length + data.length)
                        self.stubBuffer.copy(newData, 0)
                        data.copy(newData, self.stubBuffer.length)
                        // Reassign for parsing
                        data = newData

                        // Reset state of buffer
                        self.buffer = null
                        self.sizeOfMessage = 0
                        self.bytesRead = 0
                        self.stubBuffer = null
                    } else {
                        // Add the the bytes to the stub buffer
                        var newStubBuffer = new Buffer(self.stubBuffer.length + data.length)
                        // Copy existing stub buffer
                        self.stubBuffer.copy(newStubBuffer, 0)
                        // Copy missing part of the data
                        data.copy(newStubBuffer, self.stubBuffer.length)
                        // Exit parsing loop
                        data = new Buffer(0)
                    }
                } else {
                    if (data.length > 4) {
                        // Retrieve the message size
                        // var sizeOfMessage = data.readUInt32LE(0);
                        var sizeOfMessage = data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24)
                        // If we have a negative sizeOfMessage emit error and return
                        if (sizeOfMessage < 0 || sizeOfMessage > self.maxBsonMessageSize) {
                            errorObject = {
                                err: 'socketHandler',
                                trace: '',
                                bin: self.buffer,
                                parseState: {
                                    sizeOfMessage: sizeOfMessage,
                                    bytesRead: self.bytesRead,
                                    stubBuffer: self.stubBuffer
                                }
                            }
                            // We got a parse Error fire it off then keep going
                            self.emit('parseError', errorObject, self)
                            return
                        }

                        // Ensure that the size of message is larger than 0 and less than the max allowed
                        if (sizeOfMessage > 4 && sizeOfMessage < self.maxBsonMessageSize && sizeOfMessage > data.length) {
                            self.buffer = new Buffer(sizeOfMessage)
                            // Copy all the data into the buffer
                            data.copy(self.buffer, 0)
                            // Update bytes read
                            self.bytesRead = data.length
                            // Update sizeOfMessage
                            self.sizeOfMessage = sizeOfMessage
                            // Ensure stub buffer is null
                            self.stubBuffer = null
                            // Exit parsing loop
                            data = new Buffer(0)
                        } else if (
                            sizeOfMessage > 4 &&
                            sizeOfMessage < self.maxBsonMessageSize &&
                            sizeOfMessage == data.length
                        ) {
                            try {
                                emitBuffer = data
                                // Reset state of buffer
                                self.buffer = null
                                self.sizeOfMessage = 0
                                self.bytesRead = 0
                                self.stubBuffer = null
                                // Exit parsing loop
                                data = new Buffer(0)
                                // Emit the message
                                self.messageHandler(new Response(self.bson, emitBuffer, self.responseOptions), self)
                            } catch (err) {
                                self.emit('parseError', err, self)
                            }
                        } else if (sizeOfMessage <= 4 || sizeOfMessage > self.maxBsonMessageSize) {
                            errorObject = {
                                err: 'socketHandler',
                                trace: null,
                                bin: data,
                                parseState: {
                                    sizeOfMessage: sizeOfMessage,
                                    bytesRead: 0,
                                    buffer: null,
                                    stubBuffer: null
                                }
                            }
                            // We got a parse Error fire it off then keep going
                            self.emit('parseError', errorObject, self)

                            // Clear out the state of the parser
                            self.buffer = null
                            self.sizeOfMessage = 0
                            self.bytesRead = 0
                            self.stubBuffer = null
                            // Exit parsing loop
                            data = new Buffer(0)
                        } else {
                            emitBuffer = data.slice(0, sizeOfMessage)
                            // Reset state of buffer
                            self.buffer = null
                            self.sizeOfMessage = 0
                            self.bytesRead = 0
                            self.stubBuffer = null
                            // Copy rest of message
                            data = data.slice(sizeOfMessage)
                            // Emit the message
                            self.messageHandler(new Response(self.bson, emitBuffer, self.responseOptions), self)
                        }
                    } else {
                        // Create a buffer that contains the space for the non-complete message
                        self.stubBuffer = new Buffer(data.length)
                        // Copy the data to the stub buffer
                        data.copy(self.stubBuffer, 0)
                        // Exit parsing loop
                        data = new Buffer(0)
                    }
                }
            }
        }
    }
}
