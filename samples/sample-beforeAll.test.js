'use strict'

let c = 0;

describe('sample-beforeAll', (expect) => {
	beforeAll(() => {
		c++;
	});
	it('should assert beforeAll was called only once per describe', () => {
		expect(c).to.be.equal(1);
	});
	it('should assert beforeAll was not called again', () => {
		expect(c).to.be.equal(1);
	});
});
