'use strict'

describe('module', (expect) => {
	beforeAll((done) => {
		setTimeout(() => {
			console.log('beforeAll async task 1');
			done();
		}, 10);
	});
	beforeAll((done) => {
		setTimeout(() => {
			console.log('beforeAll async task 2');
			done(new Error("some error"));
		}, 10);
	});
	beforeAll((done) => {
		setTimeout(() => {
			console.log('beforeAll async task 3');
		}, 100);
	});
	beforeAll(() => {
		console.log('beforeAll sync task 1');
	});
	
	beforeEach(() => {
		console.log('beforeEach sync');
	});
	beforeEach((done) => {
		setTimeout(() => {
			console.log('beforeEach async task');
			done();
		}, 10);
	});
	
	it('should do something', (done) => {
		setTimeout(() => {
			expect(true).to.be.true;
			console.log('it async task');
			done();
		}, 10);
	});
	
	afterEach(() => {
		console.log('afterEach sync');
	});
	afterEach((done) => {
		setTimeout(() => {
			console.log('afterEach async task');
			done();
		}, 10);
	});
	
	afterAll(() => {
		console.log('afterAll sync')
	});
});
