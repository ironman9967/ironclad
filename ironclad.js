'use strict'

const path = require('path');
const spawn = require('child_process').spawn;

const cli = require('cli');
const glob = require('glob');
const _ = require('lodash');
const _async = require('async');

const debug = require('./debug');

exports.opts = {
	timeout: [ 't', 'global test timeout', 'number', 2000 ],
	slow: [ 's', 'slow test threshold', 'number', 50 ],
	'no-color': [ 'k', 'omit ANSI color escapes from the output', 'bool', false ],
	force: [ false, 'force tests to run regardless of failure', 'bool', false ],
	debug: [ false, 'increased logging for debbuging', 'bool', false ]
};

let globOpts = {
	ignore: [ 'index.test.js' ]
}

exports.load = (fileGlobs, opts) => {
	let optsJson = JSON.stringify(opts);
	if (_.isEmpty(fileGlobs)) {
		debug('RUNNING SAMPLE TEST', opts);
		fileGlobs.push('**/sample.test.js');
	}
	else {
		globOpts.ignore.push('**/sample.test.js');
	}
	debug(`options: ${optsJson}`, opts);
	debug(`glob options: ${JSON.stringify(globOpts)}`, opts);
	let matches = [];
	_.each(fileGlobs, (fileGlob) => {
		debug(`trying to match glob ${fileGlob} from ${process.cwd()}`, opts)
		matches = matches.concat(glob.sync(fileGlob, globOpts));
	});
	matches = _.uniq(matches);
	if (_.isEmpty(matches)) {
		cli.info('0 tests ran');
	}
	_async.eachSeries(matches, (filepath, cb) => {
		let fullPath = path.join(process.cwd(), `./${filepath}`);
		debug(`trying to require ${fullPath}`, opts);
		var runnerArgs = [ 
			`${path.resolve('./runner.js')}`, 
			fullPath,
			optsJson
		];
		if (opts['no-color']) {
			runnerArgs.push('--no-color');
		}
		spawn(`${process.argv[0]}`, runnerArgs, { stdio: 'inherit' })
			.on('error', (e) => {
				console.error(e);
			})
			.once('exit', (code, signal) => {
				let signalStr = signal !== null && signal !== void 0 ? ` - ${signal}` : '';
				debug(`test runner for ${filepath} exited with ${code}${signalStr}`, opts);
			});
	});
};
