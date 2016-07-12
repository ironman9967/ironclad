
require('colors');

module.exports = (msg, opts) => {
	if (opts.debug) {
		let prefix = "DEBUG: ".cyan;
		if (opts['no-color']) {
			prefix = prefix.reset;
			msg = msg.reset;
		}
		console.log(`${prefix}${msg}`);
	}
}
