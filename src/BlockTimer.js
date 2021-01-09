
const timerSeconds = 1 * 1000

class BlockTimer {
    constructor(rinfo, opts) {
        this.rinfo = rinfo;
        this.blockNumber = 1;
        this.timeoutId = null;
        this.retries = 5;

        let { endFuncAsync, retryFuncAsync } = opts
        this.endFunc = endFuncAsync;
        this.retryFunc = retryFuncAsync;

        this._retryOrEnd = this._retryOrEnd.bind(this)
    }

    async _retryOrEnd() {
        let executionContext = { rinfo: this.rinfo, blockNumber: this.blockNumber}
        if (this.retries <= 0) {
            await this.endFunc(executionContext);
        } else {
            // Resend nth DATA Packet to Client
            await this.retryFunc(executionContext);

            // Decrement retries and restart timer
            this.retries = this.retries - 1;
            this.timeoutId = setTimeout(this._retryOrEnd, timerSeconds)
        }
    }

    startTimer() {
        this.timeoutId = setTimeout(this._retryOrEnd, timerSeconds)
    }

    resetTimer(blockNumber) {
        this.blockNumber = blockNumber
        this.retries = 5

        if (this.timeoutId != null) {
            clearTimeout(this.timeoutId)
            this.timeoutId = null;
        }
    }
}

module.exports =  {
    BlockTimer
}