const dgram = require("dgram")
const { Ack } = require("../src/messages/Ack")
const { Data } = require("../src/messages/Data")
const { ErrorMessage } = require("../src/messages/ErrorMessage")
const { Server } = require("../src/Server")

describe("Server correctly returns error responses", () => {
    let tftpServer = null
    let client = null

    beforeEach(() => {
        tftpServer = new Server(41234, '127.0.0.1');
        tftpServer.startServer();
    
        client = dgram.createSocket("udp4")        
        client.bind(41233, "127.0.0.1")
    })
    
    afterEach(() => {
        if (tftpServer) {
            tftpServer.stopServer()
        }
        
        if (client) {
            client.removeAllListeners("message")
            client.close()
        }
    })

    test("Client ACK without initial RRQ fails.", done => {
        if (!client) {
            throw new Error("Client not initialized yet.")
        }

        client.on("message", (msg) => {
            try {
                let error = ErrorMessage.fromBuffer(msg)
                expect(error.errorCode).toBe(5)
                done()                
            } catch (error) {
                done(error)
            }
        })

        let msg = new Ack(1).toBuffer();

        client.send(msg, 0, msg.length, 41234, '127.0.0.1', (err) => {
            if (err) {
                done(err)
                return;
            }
        })
    })

    test("Client DATA without initial WRQ", done => {
        if (!client) {
            throw new Error("Client not initialized yet.")
        }

        client.on("message", (msg) => {
            try {
                let error = ErrorMessage.fromBuffer(msg)
                expect(error.errorCode).toBe(5)
                done()                
            } catch (error) {
                done(error)
            }
        })

        let msg = new Data(1, Buffer.from([0,1])).toBuffer();

        client.send(msg, 0, msg.length, 41234, '127.0.0.1', (err) => {
            if (err) {
                done(err)
                return;
            }
        })
    })
})