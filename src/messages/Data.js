class Data {
  constructor(blockNumber, data) {
    this.opcode = 3
    this.blockNumber = blockNumber || 0
    this.data = data || null
  }

  static fromBuffer(buffer) {
    let dataMessage = new Data()
    dataMessage.blockNumber = buffer.readUInt16BE(2)

    let copy = Buffer.from(buffer.slice(4))
    dataMessage.data = copy

    return dataMessage
  }

  toBuffer() {
    let opcodeBuf = Buffer.from([0, this.opcode])

    let blockNumberBuf = Buffer.alloc(2);
    blockNumberBuf.writeUInt16BE(this.blockNumber);
    
    let dataBuf = !this.data ? Buffer.from([]) : this.data

    let assembled = [opcodeBuf, blockNumberBuf, dataBuf]

    let totalLength = assembled.reduce((totalLen, buf) => (totalLen += buf.length), 0)

    return Buffer.concat(assembled, totalLength)
  }
}

module.exports = {
  Data,
}
