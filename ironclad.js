'use strict'

const path = require('path');
const spawn = require('child_process').spawn;

const cli = require('cli');
const glob = require('glob');
const _ = require('lodash');
const _async = require('async');
const now = require('performance-now');

const debug = require('./debug');
const duration = require('./duration');

exports.opts = {
	timeout: [ 't', 'global test timeout', 'number', 2000 ],
	slow: [ 's', 'slow test threshold', 'number', 50 ],
	'no-color': [ 'k', 'omit ANSI color escapes from the output', 'bool', false ],
	debug: [ false, 'increased logging for debbuging', 'bool', false ]
};

let globOpts = {
	ignore: [ 'index.test.js' ]
};

let started;
exports.load = (fileGlobs, opts, cb) => {
	let optsJson = JSON.stringify(opts);
	if (_.isEmpty(fileGlobs)) {
		cli.info('*****   RUNNING SAMPLE TESTS   *****');
		fileGlobs.push('**/samples/*sample*.test.js');
	}
	else {
		globOpts.ignore.push('**/samples/*sample*.test.js');
	}
	debug(`options: ${optsJson}`, opts);
	debug(`glob options: ${JSON.stringify(globOpts)}`, opts);
	let matches = [];
	_.each(fileGlobs, (fileGlob) => {
		debug(`trying to match glob ${fileGlob} in ${process.cwd()}`, opts);
		matches = matches.concat(glob.sync(fileGlob, globOpts));
	});
	matches = _.uniq(matches);
	let suite = {
		passed: 0,
		failed: 0
	};
	started = now();
	_async.eachSeries(matches, (filepath, cb) => {
		let fullPath = path.join(process.cwd(), `./${filepath}`);
		debug(`trying to require ${fullPath}`, opts);
		var runnerArgs = [ 
			`${path.resolve(path.join(__dirname, './runner.js'))}`,
			fullPath,
			optsJson
		];
		if (opts['no-color']) {
			runnerArgs.push('--no-color');
		}
		let done = false;
		let error = '';
		spawn(`${process.argv[0]}`, runnerArgs, { stdio: [ null, 'inherit', 'pipe' ] })
			.on('error', (e) => {
				let msg = `ironclad broke:\n${e.stack === void 0 ? e : e.stack}`;
				console.log(msg.red);
				if (!done) {
					done = true;
					cb(null);
				}
			})
			.once('exit', (code, signal) => {
				if (code === 0) {
					suite.passed++;
				}
				else {
					suite.failed++;
				}
				if (!_.isEmpty(error)) {
					console.error(error.red);
				}
				let signalStr = signal !== null && signal !== void 0 ? ` - ${signal}` : '';
				debug(`test runner for ${filepath} exited with ${code}${signalStr}`, opts);
				if (!done) {
					done = true;
					cb(null);
				}
			})
			.stderr.on('data', (buf) => {
				error += String(buf);
			});
	}, () => {
		cli.info(`suite complete ${duration(now() - started, { slow: -1 })}`);
		cli.info(`${suite.passed} module${suite.passed === 1 ? '' : 's'} passed`);
		if (suite.failed > 0) {
			cli.fatal(`${suite.failed} module${suite.failed === 1 ? '' : 's'} failed (see above for failure messages)`);
		}
		else {
			process.exit(0);
		}
	});
};
