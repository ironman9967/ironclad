#!/usr/bin/env node

const cli = require('cli');

const app = require('./package.json');

const ironclad = require('./ironclad');

cli.enable('version').enable('status');

cli.setApp(app.name, app.version);

cli.parse(ironclad.cliOpts);

cli.main((args, opts) => {
    ironclad.load(args, opts);
});
