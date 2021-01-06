const { ReadRequest } = require("./ReadRequest")
const { WriteRequest } = require("./WriteRequest")
const { Data } = require("./Data")
const { Ack } = require("./Ack")
const { ErrorMessage } = require("./ErrorMessage")

function parseMessage(buffer) {
    let opcode = buffer.readUInt16BE()
    let request = null
    if (opcode === 1) {
        request = ReadRequest.createRRQ(buffer)
    } else if (opcode === 2) {
        request = WriteRequest.createWRQ(buffer)
    } else if (opcode === 3) {
        request = Data.fromBuffer(buffer)
    } else if (opcode === 4) {
        request = Ack.fromBuffer(buffer)
    } else if (opcode === 5) {
        request = ErrorMessage.fromBuffer(buffer)

        console.log(`Error:errorCode ${request.errorCode}`)
        console.log(`Error:errorMessage ${request.errorMessage}`)
    } else {
        // Throw
    }

    return request
}

module.exports = {
    parseMessage
}