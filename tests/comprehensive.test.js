
const tftp = require('tftp')
const { Server } = require("../src/Server")
const fs = require("fs")
const path = require("path")

const clientGetFolder = path.join(__dirname, "client-root/get")

describe("Comprehensive Tests", () => {
    let tftpServer = null
    let client = null

    beforeAll(() => {
        // Start tftpServer
        tftpServer = new Server(41234, '127.0.0.1');
        tftpServer.startServer();
    
        // Initialize TFTP Client
        client = tftp.createClient({
            host: "127.0.0.1",
            port: 41234,
            windowSize: 1
        })
    })
    
    afterAll(() => {
        tftpServer.stopServer();
    
        // Remove all files in the client-root folder
        fs.readdir(clientGetFolder, (err, files) => {
            if (err) {
                console.error(err)
                return;
            }
    
            files.forEach(filename => {
                let fpath = path.join(clientGetFolder, filename)
                fs.rmSync(fpath)
            })
        })
    })

    test("Client gets text file to from server", (done) => {
        const localFilePath = path.join(clientGetFolder, "test.txt")
        const remoteFilePath = path.join(__dirname, "server-root",  "test.txt")
        function callback(error) {
            if (error) {
                done(error);
            }
            
            let fileStats = fs.statSync(localFilePath)
            expect(fileStats.size).toBe(8)
            done();
        }
    
        client.get(remoteFilePath, localFilePath, callback)
    })
    
    test("Client gets image file to from server", (done) => {
        const localFilePath = path.join(clientGetFolder, "cat.jpg")
        const remoteFilePath = path.join(__dirname, "server-root",  "cat.jpg")
        function callback(error) {
            if (error) {
                done(error);
            }
            
            let fileStats = fs.statSync(localFilePath)
            expect(fileStats.size).toBe(19315)
            done();
        }
    
        client.get(remoteFilePath, localFilePath, callback)
    })
})





