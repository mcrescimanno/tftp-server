const { Server } = require('./Server')

let tftpServer = new Server(41234, '127.0.0.1'); // Defaults to (69, 0.0.0.0)
tftpServer.startServer();