'use strict'

const roundTo = require('round-to');

module.exports = (dur, opts) => {
	let durMsg = `(${roundTo(dur, 2)}ms)`;
	if (dur > opts.slow && opts.slow > -1) {
		durMsg = durMsg.red;
	}
	else if (dur > (opts.slow / 2) && opts.slow > -1) {
		durMsg = durMsg.yellow;
	}
	else {
		durMsg = durMsg.green;
	}
	return durMsg;
}
