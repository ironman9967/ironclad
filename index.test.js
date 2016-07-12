'use strict'

const _ = require('lodash');

const ironclad = require('./ironclad');

let opts = {};
for (let opt in ironclad.opts) {
	opts[opt] = ironclad.opts[opt][3];
}
opts.force = true;
opts.debug = true;

ironclad.load([], opts);
