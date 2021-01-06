const fs = require("fs")

class WriteFileStream {
    constructor(filepath, mode) {
        this.filepath = filepath;
        this.mode = mode;
        
        this.defaultEncoding = 'utf8';
        if (typeof mode === 'string' && mode.length > 0) {
            if (mode === 'octet') this.defaultEncoding = 'hex';
        }
        
        // File Descriptor (https://en.wikipedia.org/wiki/File_descriptor)
        this.fd = null

        this.writeStream = fs.createWriteStream(filepath)
            .on("error", this._onError.bind(this))
            .on("finish", this._onFinish.bind(this))
            .on("drain", this._onDrain.bind(this))
            .on("close", this._onClose.bind(this))
            .on("open", this._onOpen.bind(this))
            .on("ready", this._onReady.bind(this))

        this.writeStream.setDefaultEncoding(this.defaultEncoding);
    }

    _onError(err) {
        // The 'error' event is emitted if an error occurred while writing or piping data.
        console.error(err);
    }

    _onFinish() {
        // The 'finish' event is emitted after the stream.end() method has been called
        let x = 1;
    }

    _onDrain() {
        // If a call to stream.write(chunk) returns false, the 'drain' event will be emitted when it is appropriate to resume writing data to the stream.
        let x = 1;
    }

    _onClose() {
        // Emitted when the WriteStream's underlying file descriptor has been closed.
        let x = 1;
    }

    _onOpen(fd) {
        // Emitted when the WriteStream's file is opened.
        this.fd = fd;
    }

    _onReady() {
        // Emitted when the fs.WriteStream is ready to be used.
        // Fires immediately after 'open'.
        let x = 1;
    }
}

module.exports = {
    WriteFileStream
}