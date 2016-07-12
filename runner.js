'use strict'

const cli = require('cli').enable('status');
const _async = require('async');
const now = require('performance-now');
const chai = require('chai');
require('colors');

const debug = require('./debug');
const duration = require('./duration');

let opts = JSON.parse(process.argv[3]);

let moduleName, moduleStarted;

let beforeAlls, befores, its, afters, afterAlls;

let modulePrefix = `${opts['no-color'] ? `` : `${String.fromCharCode(0x270e)}`} `;
let passedPrefix = `\t${opts['no-color'] ? `` : `${String.fromCharCode(0x2714)}`} it `;
let failedPrefix = `\t${opts['no-color'] ? `` : `${String.fromCharCode(0x2718)}`} it `;
let timeoutPrefix =	`\t${opts['no-color'] ? `` : `${String.fromCharCode(0x29d6)}`} it `;

global.describe = (name, cb) => {
	moduleStarted = now();
	moduleName = name;
	debug(`${moduleName} started at ${duration(moduleStarted, { slow: -1 })}`, opts);
	
	beforeAlls = [];
	befores = [];
	its = [];
	afters = [];
	afterAlls = [];
	
	info(`${modulePrefix}${moduleName}`);
	cb(chai.expect);
	
	_async.waterfall([
		(cb) => {
			if (its.length > 0) {
				runSet('beforeAll', beforeAlls, false, () => {
					cb(null);
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
						runSet('beforeEach', befores, false, () => {
							cb(null);
						});
					},
					(cb) => {
						runSet(it.description, [ it.fn ], true, () => {
							cb(null);
						});
					},
					(cb) => {
						runSet('afterEach', afters, false, () => {
							cb(null);
						});
					}
				], (e) => {
					cb(null);
				});
			}, (e) => {
				cb(null);
			});
		},
		(cb) => {
			if (its.length > 0) {
				runSet('afterAll', afterAlls, false, () => {
					cb(null);
				});
			}
			else {
				cb(null);
			}
		}
	], () => {
		info(`finished ${its.length} test${its.length === 1 ? '' : 's'}`);
		process.exit(0);
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
	_async.eachOfSeries(fns, (fn, i, cb) => {
		let istr = fns.length === 1 ? '' : ` ${i + 1}`;
		let started = now();
		let timeout = setTimeout(() => {
			let msg = `${timeoutPrefix}${setName}${istr} ${duration(now() - started, opts)}`;
			console.log('TIMEOUT'.red + ':', msg);
			process.exit(1);
		}, opts.timeout);
		if (isAsync(fn)) {
			fn((e) => {
				if (!timeout._called) {
					clearTimeout(timeout);
					if (e !== void 0 && e !== null) {
						let msg = `${failedPrefix}${setName}${istr} failed:\n${e.stack === void 0 ? e : e.stack}`;
						if (isTest) {
							msg = `it ${msg}`;
						}
						console.log('FAILED'.red + ':', msg);
						process.exit(1);
					}
					else  {
						logCompletion(isTest, started, setName, istr);
					}
					clearTimeout(timeout);
				}
				cb(null);
			});
		}
		else {
			fn();
			clearTimeout(timeout);
			logCompletion(isTest, started, setName, istr);
			cb(null);
		}
	}, () => {
		cb();
	});
}

function isAsync(fn) {
	return /\([a-zA-Z][\w\d]*\){1}/.test(fn.toString().split('\n')[0]);
}

function logCompletion(isTest, started, setName, istr) {
	if (isTest) {
		console.log('PASSED'.green + ':', `${passedPrefix}${setName}${istr} ${duration(now() - started, opts)}`);
	}
	else {
		debug(`${setName}${istr} completed ${duration(now() - started, opts)}`, opts);
	}
}

function info(msg) {
	console.log('INFO'.yellow + ':', msg);
}
