'use strict'

const _ = require('lodash');

const ironclad = require('./ironclad');

let cliOpts = {};
for (let opt in ironclad.cliOpts) {
	cliOpts[opt] = ironclad.cliOpts[opt][3];
}
cliOpts.force = true;
cliOpts.slow = 50;
ironclad.load([], cliOpts);
