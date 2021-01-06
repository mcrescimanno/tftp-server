class WriteRequest {
  constructor() {
    this.filename = null
    this.mode = null
    this.opcode = 2
  }

  static createWRQ(buffer) {
    var req = new WriteRequest()

    var filenameInx = buffer.indexOf(0, 2, "utf8")
    var modeInx = buffer.lastIndexOf(0)

    if (filenameInx === -1) {
      // Throw
    }

    if (modeInx === -1) {
      // Throw
    }

    req.filename = buffer.toString("utf8", 2, filenameInx)
    req.mode = buffer.toString("utf8", filenameInx + 1, modeInx)

    return req
  }

  toBuffer() {
    let filenameBuf = Buffer.from(this.filename)
    let modeBuf = Buffer.from(this.mode)
    let opcodeBuf = Buffer.from([0, this.opcode])
    let zeroByteBuf = Buffer.from([0])

    let assembled = [opcodeBuf, filenameBuf, zeroByteBuf, modeBuf, zeroByteBuf]
    let totalLength = assembled.reduce((totalLen, buf) => (totalLen += buf.length), 0)

    return Buffer.concat(assembled, totalLength)
  }
}

module.exports = {
  WriteRequest,
}
