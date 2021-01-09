const fs = require("fs");

class ReadFileStream {
    constructor(filepath, mode) {
        this.filepath = filepath;
        this.mode = mode;

        this.defaultEncoding = 'utf8';
        if (typeof mode === 'string' && mode.length > 0) {
            if (mode === 'octet') this.defaultEncoding = 'hex';
        }

        // File Descriptor (https://en.wikipedia.org/wiki/File_descriptor)
        this.fd = null;
    }

    readBlock(blockNumber) {
        let blockIndex = blockNumber - 1;
        let startByte = blockIndex * 512
        let buf = Buffer.alloc(512)

        let bytesRead = fs.readSync(this.fd, buf, 0, 512, startByte)
        if (bytesRead < 512) {
            // Note: subarray creates a new buffer that references the same underlying data as buf.
            // Modifying actualSizeBuf will modify buf.
            let actualSizeBuf = buf.subarray(0, bytesRead)
            return actualSizeBuf
        }
        return buf;
    }

    close() {
        fs.closeSync(this.fd)
    }

    readBlockAsync(blockNumber) {
        let blockIndex = blockNumber - 1;
        let startByte = blockIndex * 512
        let buf = Buffer.alloc(512)

        return new Promise((resolve,reject) => {
            fs.read(this.fd, buf, 0, 512, startByte, (err, bytesRead, buffer) => {
                if (err) {
                    reject(err)
                }
                else {
                    if (bytesRead < 512) {
                        // Note: subarray creates a new buffer that references the same underlying data as buf.
                        // Modifying actualSizeBuf will modify buf.
                        let actualSizeBuf = buffer.subarray(0, bytesRead)
                        resolve(actualSizeBuf)
                        return;
                    }
                    resolve(buffer)
                    return;                
                }
            });
        });
    }
    
    closeAsync() {
        return new Promise((resolve, reject) => {
            fs.close(this.fd, (err) => {
                if (err) {
                    reject(err)
                }
                else {
                    resolve(null)
                }
            })
        })
    }
}

ReadFileStream.createFileStreamAsync = function(filepath, mode) {
    let rfs = new ReadFileStream(filepath, mode);
    return new Promise((resolve, reject) => {
        fs.open(rfs.filepath, 'r', (err, fd) => {
            if (err) {
                reject(err)
            } else {
                rfs.fd = fd;
                resolve(rfs);
            }
        })
    })
}

ReadFileStream.createFileStream = function(filepath, mode) {
    let rfs = new ReadFileStream(filepath, mode)
    rfs.fd = fs.openSync(rfs.filepath, 'r')
    return rfs;
}

module.exports = {
    ReadFileStream
}