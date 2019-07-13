'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class EmailMissingTest extends SetPasswordTest {

	get description () {
		return 'should redirect with an error if trying to set a password with a token that is missing the email';
	}

	before (callback) {
		// replace the token with a new one, and remove the email
		super.before(error => {
			if (error) { return callback(error); }
			this.data.token = new TokenHandler(SecretsConfig.auth).generate({ }, 'rst');
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/user/password/reset/invalid', 'redirected to incorrect url');
	}
}

module.exports = EmailMissingTest;
