class ErrorMessage {
  constructor(errorCode, errorMessage) {
    this.opcode = 5
    this.errorCode = errorCode || 0
    this.errorMessage = errorMessage || "A problem occurred.";
  }

  static fromBuffer(buffer) {
    let error = new ErrorMessage()
    error.errorCode = buffer.readUInt16BE(2)

    let endErrorMessageInx = buffer.lastIndexOf(0)
    if (endErrorMessageInx === -1) {
      throw new Error("Invalid Error: unable to parse error message.")
    }

    error.errorMessage = buffer.toString("utf8", 4, endErrorMessageInx)
    return error
  }

  toBuffer() {
    let zeroByteBuf = Buffer.alloc(1, 0)
    let opcodeBuf = Buffer.from([0, this.opcode])

    let errorCodeBuf = Buffer.alloc(2)
    errorCodeBuf.writeUInt16BE(this.errorCode)

    let errorMessageBuf = Buffer.from(this.errorMessage)

    let assembled = [opcodeBuf, errorCodeBuf, errorMessageBuf, zeroByteBuf]
    let totalLength = assembled.reduce((totalLen, buf) => (totalLen += buf.length), 0)

    return Buffer.concat(assembled, totalLength)
  }
}

module.exports = {
  ErrorMessage,
}
