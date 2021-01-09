require('dotenv').config()
const { Server } = require('./Server')
const { log } = require("./log")

log.info("Booting Up")
let tftpServer = new Server(41234, '127.0.0.1'); // Defaults to (69, 0.0.0.0)
tftpServer.startServer();