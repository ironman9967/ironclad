
const cli = require('cli').enable('status');
const _async = require('async');
const now = require('performance-now');
const roundTo = require('round-to');
const chai = require('chai');
require('colors');

const debug = require('./debug');

let opts = JSON.parse(process.argv[3]);

let moduleName, moduleStarted;

let beforeAlls, befores, its, afters, afterAlls;

global.describe = (name, cb) => {
	moduleStarted = now();
	moduleName = name;
	debug(`${moduleName} started at ${roundTo(moduleStarted, 2)}ms`, opts);
	
	beforeAlls = [];
	befores = [];
	its = [];
	afters = [];
	afterAlls = [];
	
	cli.info(`${moduleName} --`);
	cb(chai.expect);
	
	_async.waterfall([
		(cb) => {
			if (its.length > 0) {
				runSet('beforeAll', beforeAlls, false, (e) => {
					cb(e);
				});
			}
			else {
				cb(null);
			}
		},
		(cb) => {
			_async.eachSeries(its, (it, cb) => {
				_async.waterfall([
					(cb) => {
						runSet('beforeEach', befores, false, (e) => {
							cb(e);
						});
					},
					(cb) => {
						runSet(it.description, [ it.fn ], true, (e) => {
							cb(e);
						});
					},
					(cb) => {
						runSet('afterEach', afters, false, (e) => {
							cb(e);
						});
					}
				], (e) => {
					cb(e);
				});
			}, (e) => {
				cb(e);
			});
		},
		(cb) => {
			if (its.length > 0) {
				runSet('afterAll', afterAlls, false, (e) => {
					cb(e);
				});
			}
			else {
				cb(null);
			}
		}
	], (e) => {
		if (e !== null) {
			throw e;
		}
		else {
			let pural = its.length === 1 ? '' : 's';
			cli.info(`finished ${its.length} test${pural} (${roundTo(now() - moduleStarted, 2)}ms)`);
		}
	});
}

global.beforeAll = (fn) => {
	beforeAlls.push(fn);
}

global.beforeEach = (fn) => {
	befores.push(fn);
}

global.it = (testDescription, fn) => {
	its.push({
		description: testDescription,
		fn: fn
	});
}

global.afterEach = (fn) => {
	afters.push(fn);
}

global.afterAll = (fn) => {
	afterAlls.push(fn);
}

require(process.argv[2]);

function runSet(setName, fns, isTest, cb) {
	let failed = false;
	_async.eachOfSeries(fns, (fn, i, cb) => {
		if (opts.force || !failed) {
			let istr = fns.length === 1 ? '' : ` ${i + 1}`;
			let started = now();
			let timeout = setTimeout(() => {
				let msg = `${setName}${istr} timed out after ${roundTo(now() - started, 2)}ms`;
				if (opts.force) {
					cli.error(msg);
					cb(null);
				}
				else {
					cli.fatal(msg);
				}
			}, opts.timeout);
			if (isAsync(fn)) {
				fn((e) => {
					if (!timeout._called) {
						if (e !== void 0 && e !== null) {
							failed = true;
							let msg = `${setName}${istr} failed:\n${e.stack === void 0 ? e : e.stack}`;
							if (opts.force) {
								cli.error(msg);
							}
							else {
								cli.fatal(msg);
							}
						}
						else if (isTest) {
							let dur = now() - started;
							let durMsg = `(${roundTo(dur, 2)}ms)`;
							if (dur > opts.timing) {
								durMsg = durMsg.red;
							}
							else if (dur > (opts.timing / 2)) {
								durMsg = durMsg.yellow;
							}
							else {
								durMsg = durMsg.green;
							}
							console.log('OK: '.green, `\t${setName}${istr} passed ${durMsg}`);
						}
						else {
							debug(`${setName}${istr} completed (${roundTo(now() - started, 2)}ms)`, opts);
						}
						clearTimeout(timeout);
					}
					cb(null);
				});
			}
			else {
				fn();
				clearTimeout(timeout);
				cb(null);
			}
		}
		else {
			cb(null);
		}
	}, (e) => {
		cb(e);
	});
}

function isAsync(fn) {
	return /\([a-zA-Z][\w\d]*\){1}/.test(fn.toString().split('\n')[0]);
}

