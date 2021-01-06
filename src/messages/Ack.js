class Ack {
  constructor(blockNumber) {
    this.opcode = 4
    this.blockNumber = blockNumber || 0
  }

  static fromBuffer(buffer) {
    let ack = new Ack()
    ack.blockNumber = buffer.readUInt16BE(2)
    
    return ack
  }

  // An Ack with a zero block nunber is used to respond to WRQ.
  static getDefaultAck() {
    return new Ack()
  }

  toBuffer() {
    let opcodeBuf = Buffer.alloc(2);
    opcodeBuf.writeInt16BE(this.opcode);
    
    let blockNumBuf = Buffer.alloc(2);
    blockNumBuf.writeInt16BE(this.blockNumber);

    return Buffer.concat([opcodeBuf, blockNumBuf]);
  }
}

module.exports = {
  Ack,
}
