'use strict'

const path = require('path');

const cli = require('cli');
const _ = require('lodash');
const _async = require('async');
const glob = require('glob');
const now = require('performance-now');
const roundTo = require('round-to');
const chai = require('chai');
require('colors');

exports.cliOpts = {
	timeout: [ 't', 'global test timeout', 'number', 2000 ],
	slow: [ 's', 'slow test threshold', 'number', 50 ],
	force: [ false, 'force tests to run regardless of failure', 'bool', false ]
};

let globOpts = {
	ignore: [ 'index.test.js' ]
}
let options;

exports.load = (fileGlobs, opts) => {
	options = opts;
	cli.debug(`options: ${JSON.stringify(options)}`);
	if (_.isEmpty(fileGlobs)) {
		fileGlobs.push('**/sample.test.js');
	}
	else {
		globOpts.ignore.push('**/sample.test.js');
	}
	cli.debug(`glob options: ${JSON.stringify(globOpts)}`);
	let matches = [];
	_.each(fileGlobs, (fileGlob) => {
		cli.debug(`trying to match glob ${fileGlob} from ${process.cwd()}`)
		matches = matches.concat(glob.sync(fileGlob, globOpts));
	});
	matches = _.uniq(matches);
	if (_.isEmpty(matches)) {
		cli.info('0 tests ran');
	}
	_.each(matches, (filepath) => {
		let reqPath = path.join(process.cwd(), `./${filepath}`);
		cli.debug(`trying to require ${reqPath}`);
		require(reqPath);
	});
};

let moduleName, moduleStarted;

let beforeAlls, befores, its, afters, afterAlls;

global.describe = (name, cb) => {
	moduleStarted = now();
	moduleName = name;
	cli.debug(`${moduleName} started at ${roundTo(moduleStarted, 2)}ms`);
	
	beforeAlls = [];
	befores = [];
	its = [];
	afters = [];
	afterAlls = [];
	
	cb(chai.expect);
	
	_async.waterfall([
		(cb) => {
			if (!_.isEmpty(its)) {
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
						runSet(it.desciption, [ it.fn ], true, (e) => {
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
			if (!_.isEmpty(its)) {
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
			cli.info(`finished ${its.length} tests (${roundTo(now() - moduleStarted, 2)}ms)`);
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
		desciption: testDescription,
		fn: fn
	});
}

global.afterEach = (fn) => {
	afters.push(fn);
}

global.afterAll = (fn) => {
	afterAlls.push(fn);
}

function runSet(setName, fns, isTest, cb) {
	let failed = false;
	_async.eachOfSeries(fns, (fn, i, cb) => {
		if (options.force || !failed) {
			let istr = fns.length === 1 ? '' : ` ${i + 1}`;
			let started = now();
			let timeout = setTimeout(() => {
				let msg = `${setName}${istr} timed out after ${roundTo(now() - started, 2)}ms`;
				if (options.force) {
					cli.error(msg);
					cb(null);
				}
				else {
					cli.fatal(msg);
				}
			}, options.timeout);
			if (isAsync(fn)) {
				fn((e) => {
					if (!timeout._called) {
						if (e !== void 0 && e !== null) {
							failed = true;
							let msg = `${setName}${istr} failed:\n${e.stack === void 0 ? e : e.stack}`;
							if (options.force) {
								cli.error(msg);
							}
							else {
								cli.fatal(msg);
							}
						}
						else if (isTest) {
							let dur = now() - started;
							let durMsg = `(${roundTo(dur, 2)}ms)`;
							if (dur > options.timing) {
								durMsg = durMsg.red;
							}
							else if (dur > (options.timing / 2)) {
								durMsg = durMsg.yellow;
							}
							else {
								durMsg = durMsg.green;
							}
							console.log('OK: '.green, `${moduleName} ${setName}${istr} passed ${durMsg}`);
						}
						else {
							cli.debug(`${setName}${istr} completed (${roundTo(now() - started, 2)}ms)`);
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
