
const tftp = require('tftp')
const { Server } = require("../src/Server")
const fs = require("fs")
const path = require("path")

const clientGetFolder = path.join(__dirname, "client-root/get")

async function cleanupTestFiles() {
    let rmPromise = function(fpath) {
        return new Promise((resolve, reject) => {
            fs.rm(fpath, (err) => {
                if (err) return reject(err);
                return resolve(null)
            })
        })
    }

    return new Promise(async(resolve, reject) => {
        fs.readdir(clientGetFolder, async (err, files) => {
            if (err) return reject(err);
    
            files.forEach(async filename => {
                let fpath = path.join(clientGetFolder, filename)
                await rmPromise(fpath)
            })

            resolve(null)
            return;
        })
    })
}

describe("Basic Upload/Download Tests", () => {
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
    
    afterAll(async () => {
        tftpServer.stopServer();
    
        // Remove all files in the client-root folder
        await cleanupTestFiles();
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

    // test("Client uploads image file to server.", done => {

    // })
})





