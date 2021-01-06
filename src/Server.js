const dgram = require("dgram")

const { WriteFileStream } = require("./WriteFileStream")
const { ReadFileStream } = require("./ReadFileStream")
const { parseMessage } = require('./messages/utilities')
const { Ack } = require('./messages/Ack')
const { Data } = require("./messages/Data")
const { ErrorMessage } = require("./messages/ErrorMessage")

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
        console.log(`server listening ${address.address}:${address.port}`)
    }

    _onError(err) {
        console.log(`server error:\n${err.stack}`)
        this.socket.close()
    }

    _onClose() {
        console.log("Closing")
    }

    _onConnect() {
        console.log("Connecting")
    }

    _onMessage(msg, rinfo) {
        let request = parseMessage(msg)
        if (request.opcode === 1) {
            this.handleRRQ(request, rinfo);
        }
        else if (request.opcode === 2) {
            this.handleWRQ(request, rinfo);
        }
        else if (request.opcode === 3) {
            this.handleData(request, rinfo);
        }
        else if (request.opcode === 4) {
            this.handleAck(request, rinfo);
        }
    }

    /* Private Methods */

    handleRRQ(request, rinfo) {
        /* 
            1. Open a readstream on a file, throw error to client if not exists (record job in memory)
            2. Assemble initial DATA Packet from first 512 bytes of file, send to client
            3. Resend DATA if no response (until retries hits 0, then send error and remove job)
        */
        let clientTID = `${rinfo.address}:${rinfo.port}`;
        const existingJob = this.currentJobs.get[clientTID]

        if (!existingJob) {
            let job = {
                rinfo: rinfo,
                // We need to catch if the file exists, and send error if not.
                stream: ReadFileStream.createFileStream(request.filename, request.mode),
                filename: request.filename,
                mode: request.mode,
                sentFinalDataPacket: false
            }

            this.currentJobs.get[clientTID] = job

            // Send first data packet back
            let firstBlock = job.stream.readBlock(1)
            let data = new Data(1, firstBlock);
            this.socket.send(data.toBuffer(), rinfo.port, rinfo.address, (err, bytesSent) => {
                if (err) console.error(err);

                if (firstBlock.length < 512) {
                    job.sentFinalDataPacket = true
                }
            })            
        }
        else {
            // RRQ alread exists and in progress. What to do in this case? Do we send an error to client?
        }
    }

    handleAck(request, rinfo) {
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
                rfs.close()
                delete this.currentJobs.get[clientTID];
            }
            else {
                // Send nth Block
                let nthBlock = rfs.readBlock(nextBlockNumber)
                let data = new Data(nextBlockNumber, nthBlock);
                this.socket.send(data.toBuffer(), rinfo.port, rinfo.address, (err, bytesSent) => {
                    if (err) console.error(err);

                    if (nthBlock.length < 512) {
                        existingJob.sentFinalDataPacket = true
                    }
                })
            }            
        }
        else {
            let error = new ErrorMessage(5, "Unknown transfer ID.")
            this._sendError(error, rinfo.port, rinfo.address)
        }
    }

    handleWRQ(request, rinfo) {
        let clientTID = `${rinfo.address}:${rinfo.port}`;
        const exists = this.currentJobs.put[clientTID]

        // Validate that the filename is not outside of the server root (ie ../../path/to/file)

        if (!exists) {
            let job = {
                rinfo: rinfo,
                stream: new WriteFileStream(request.filename, request.mode),
                filename: request.filename,
                mode: request.mode
            };
        
            this.currentJobs.put[clientTID] = job;    
            this._sendWQRAck(rinfo.port, rinfo.address);
        }
        else {
            // WRQ already exists/in progress. What to do in this case? Do we send an error to client?            
        }
    }

    handleData(request, rinfo) {    
        let clientTID = `${rinfo.address}:${rinfo.port}`;
        const existingJob = this.currentJobs.put[clientTID];

        if (existingJob) {
            let fileStream = existingJob.stream.writeStream;
            let isLastDataPacket = request.data.length < 512;
            fileStream.write(request.data);
    
            if (isLastDataPacket) {
                fileStream.end(null, null, () => {
                    delete this.currentJobs.put[clientTID];
                });
            }
    
            let ack = new Ack(request.blockNumber).toBuffer();
            this.socket.send(ack, rinfo.port, rinfo.address);
        } 
        else {
            let error = new ErrorMessage(5, "Unknown transfer ID.")
            this._sendError(error, rinfo.port, rinfo.address)
        }
    }

    _sendWQRAck(port, address) {
        let ack = Ack.getDefaultAck().toBuffer();
        this.socket.send(ack, port, address);
    }

    _sendError(errorMessage, port, address) {
        let serialized = errorMessage.toBuffer()
        this.socket.send(serialized, port, address)
    }

    /* Public Methods */

    startServer() {
        this.socket.bind(this.port, this.address)
    }
    
    stopServer() {
        this.socket.close(() => console.log("TFTP Server Stopped"));
    }
}

module.exports = {
    Server
}