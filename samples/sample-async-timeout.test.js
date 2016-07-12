'use strict'

describe('sample-async-timeout', (expect) => {
	it('should timeout', (done) => {
		setTimeout(() => {
			done();
		}, 2500);
	});
});
