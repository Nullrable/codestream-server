'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const APICapabilities = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/etc/capabilities');
const Assert = require('assert');

class CapabilitiesTest extends CodeStreamAPITest {

	get description () {
		return 'should return API server capabilities when requested';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/no-auth/capabilities';
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepStrictEqual(data.capabilities, APICapabilities, 'returned capabilities are not correct');
		Assert.strictEqual(data.environment, this.apiConfig.sharedGeneral.runTimeEnvironment, 'environment not correct');
		Assert.strictEqual(data.isOnPrem, this.apiConfig.sharedGeneral.isOnPrem, 'isOnPrem is not correct');
		Assert.strictEqual(data.isProductionCloud, this.apiConfig.sharedGeneral.isProductionCloud, 'isProductionCloud is not correct');
		Assert.strictEqual(data.newRelicLandingServiceUrl, this.apiConfig.sharedGeneral.newRelicLandingServiceUrl, 'newRelicLandingServiceUrl is not correct');
	}
}

module.exports = CapabilitiesTest;
