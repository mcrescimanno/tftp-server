const dgram = require("dgram")

const { WriteFileStream } = require("./WriteFileStream")
const { ReadFileStream } = require("./ReadFileStream")
const { parseMessage } = require('./messages/utilities')
const { Ack } = require('./messages/Ack')
const { Data } = require("./messages/Data")
const { ErrorMessage } = require("./messages/ErrorMessage")
const { log } = require("./log")


class Server {
    constructor(port, address) {
        this.port = port || 69; // Default TFTP Port
        this.address = address || "0.0.0.0";
        this.root = process.env.PWD;
        
        this.currentJobs = {
            put: {},
            get: {}
        }

        this.socket = dgram.createSocket("udp4")
            .on("close", this._onClose.bind(this))
            .on("connect", this._onConnect.bind(this))
            .on("error", this._onError.bind(this))
            .on("listening", this._onListening.bind(this))
            .on("message", this._onMessage.bind(this))
        ;
    }

    /* Event Handlers for UDP Socket */

    _onListening() {
        /* Called after socket.bind */
        let address = this.socket.address()
        log.info(`server listening ${address.address}:${address.port}`)
    }

    _onError(err) {
        log.error(`server error:\n${err.stack}`)
        this.socket.close()
    }

    _onClose() {
        log.info("Closing")
    }

    _onConnect() {
        log.info("Connecting")
    }

    async _onMessage(msg, rinfo) {
        let request = parseMessage(msg)
        if (request.opcode === 1) {
            await this.handleRRQ(request, rinfo);
        }
        else if (request.opcode === 2) {
            await this.handleWRQ(request, rinfo);
        }
        else if (request.opcode === 3) {
            await this.handleData(request, rinfo);
        }
        else if (request.opcode === 4) {
            await this.handleAck(request, rinfo);
        }
    }

    /* Private Methods */

    async handleRRQ(request, rinfo) {
        /* 
            1. Open a readstream on a file, throw error to client if not exists (record job in memory)
            2. Assemble initial DATA Packet from first 512 bytes of file, send to client
            3. Resend DATA if no response (until retries hits 0, then send error and remove job)
        */
        let clientTID = `${rinfo.address}:${rinfo.port}`;
        const existingJob = this.currentJobs.get[clientTID]

        if (!existingJob) {
            
            let rfs = null;
            try {
                rfs = await ReadFileStream.createFileStreamAsync(request.filename, request.mode)    
            } catch (err) {
                if (err.code === "ENOENT") {
                    let error = new ErrorMessage(1, "File not found.")
                    return await this._sendError(error, rinfo.port, rinfo.address)
                }
                else {
                    throw err;
                }
            }
            
            
            let job = {
                rinfo: rinfo,                
                stream: rfs,
                filename: request.filename,
                mode: request.mode,
                sentFinalDataPacket: false
            }

            this.currentJobs.get[clientTID] = job

            // Send first data packet back
            let firstBlock = await job.stream.readBlockAsync(1)
            let data = new Data(1, firstBlock);
            await this._sendAsync(data.toBuffer(), rinfo.port, rinfo.address)

            if (firstBlock.length < 512) {
                job.sentFinalDataPacket = true
            }
        }
        else {
            // RRQ alread exists and in progress. What to do in this case? Do we send an error to client?
        }
    }

    async handleAck(request, rinfo) {
        /*
            1. Find existing job for this clientTID, send error to client if not exists
            2. Assemble nth (ack.blockNumber + 1) DATA Packet from the readstream
            3. Handle if last data packet to send to client (only done when we receive the ack for the last data packet)
            3. Resend DATA if no response (until retries hits 0, then send error and remove job)
        */
        let clientTID = `${rinfo.address}:${rinfo.port}`;
        const existingJob = this.currentJobs.get[clientTID]

        if (existingJob) {
            let rfs = existingJob.stream;
            let nextBlockNumber = request.blockNumber + 1;

            if (existingJob.sentFinalDataPacket) {
                await rfs.closeAsync()
                delete this.currentJobs.get[clientTID];
            }
            else {
                // Send nth Block
                let nthBlock = await rfs.readBlockAsync(nextBlockNumber)
                let data = new Data(nextBlockNumber, nthBlock);
                await this._sendAsync(data.toBuffer(), rinfo.port, rinfo.address)

                if (nthBlock.length < 512) {
                    existingJob.sentFinalDataPacket = true
                }
            }            
        }
        else {
            let error = new ErrorMessage(5, "Unknown transfer ID.")
            await this._sendError(error, rinfo.port, rinfo.address)
        }
    }

    async handleWRQ(request, rinfo) {
        let clientTID = `${rinfo.address}:${rinfo.port}`;
        const exists = this.currentJobs.put[clientTID]

        // Validate that the filename is not outside of the server root (ie ../../path/to/file)

        if (!exists) {
            let wfs = new WriteFileStream(request.filename, request.mode)
            let job = {
                rinfo: rinfo,
                stream: wfs,
                filename: request.filename,
                mode: request.mode
            };
        
            this.currentJobs.put[clientTID] = job;    
            await this._sendWQRAck(rinfo.port, rinfo.address);
        }
        else {
            // WRQ already exists/in progress. What to do in this case? Do we send an error to client?            
        }
    }

    async handleData(request, rinfo) {    
        let clientTID = `${rinfo.address}:${rinfo.port}`;
        const existingJob = this.currentJobs.put[clientTID];

        if (existingJob) {
            let wfs = existingJob.stream;
            let isLastDataPacket = request.data.length < 512;
            await wfs.writeChunk(request.data);
    
            if (isLastDataPacket) {
                await wfs.end()
                delete this.currentJobs.put[clientTID];
            }
    
            let ack = new Ack(request.blockNumber).toBuffer();
            await this._sendAsync(ack, rinfo.port, rinfo.address)
        } 
        else {
            let error = new ErrorMessage(5, "Unknown transfer ID.")
            await this._sendError(error, rinfo.port, rinfo.address)
        }
    }

    async _sendWQRAck(port, address) {
        let ack = Ack.getDefaultAck().toBuffer();
        await this._sendAsync(ack, port, address)
    }

    async _sendError(errorMessage, port, address) {
        let serialized = errorMessage.toBuffer()
        await this._sendAsync(serialized, port, address)
    }

    // Small Promise-wrapper for dgram.socket.send callback api
    _sendAsync(msg, port, address) {
        return new Promise((resolve, reject) => {
            this.socket.send(msg, port, address, (err, bytes) => {
                if (err) {
                    reject(err)
                }
                else {
                    resolve(bytes)
                }                
            })
        })
    }

    /* Public Methods */

    startServer() {
        this.socket.bind(this.port, this.address)
    }
    
    stopServer() {
        this.socket.close()
    }
}

module.exports = {
    Server
}