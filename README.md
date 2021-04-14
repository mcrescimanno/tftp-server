# tftp-server
A simple TFTP Server using Node.js

Following the guidelines set forth by [RFC 1350](https://tools.ietf.org/html/rfc1350), I created a very basic TFTP server that can handle sending and receiving files up to a theoretical maximum size of ~33.5 MB. This implementation handles all of the standard TFTP Opcodes (ie. RRQ, WRQ, ACK, DATA, ERR) and additionally has a retry mechanism in the event that the TFTP client fails to ACK a DATA packet during the course of an RRQ.

## How to use:
1) Clone the repository
2) Navigate to the root of the project, and install dependencies.
```bash
cd tftp-server
npm install
```
3) Start the TFTP Service
```javascript
const tftpServer = new Server(41234, '127.0.0.1'); // Defaults: Port - 69 (from RFC); Host - 0.0.0.0;
tftpServer.startServer();
```
Note: The TFTP service will only be able to serve files from the working directory (or subdirectories) in which the node process runs.
