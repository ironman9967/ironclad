'use strict'

let c = 0;

describe('sample-afterAll', (expect) => {
	it('should assert afterAll was called only once per describe', () => {
		expect(c).to.be.equal(0);
	});
	it('should assert afterAll was not called again', () => {
		expect(c).to.be.equal(0);
	});
	afterAll(() => {
		expect(++c).to.be.equal(1);
	});
});
