const bunyan = require('bunyan')

const logDirectory = `${process.env.LOG_DIR || './logs'}`

log = bunyan.createLogger({
  name : 'tftp-server',
  serializers : bunyan.stdSerializers,
  streams : [{
    type : 'rotating-file',
    path : `${logDirectory}/tftp-server.log`,
    period : '1d', 
    count : 3,
    level : process.env.LOG_LEVEL || 'info', // ENUM : trace, debug, info, warn, err, fatal 
  }]
})

module.exports = {
  log
}