'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
var UserCreator = require('./user_creator');
var ConfirmCode = require('./confirm_code');
var Tokenizer = require('./tokenizer');

const CONFIRMATION_CODE_TIMEOUT = 7 * 24 * 60 * 60 * 1000;

class RegisterRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.confirmationRequired = !this.api.config.api.confirmationNotRequired || this.request.body._forceConfirmation;
		delete this.request.body._forceConfirmation;
	}

	authorize (callback) {
		return callback(false);
	}

	process (callback) {
		BoundAsync.series(this, [
			this.allow,
			this.require,
			this.generateConfirmCode,
			this.generateToken,
			this.saveUser,
			this.sendEmail
		], (error) => {
			if (error) { return callback(error); }
			this.responseData = { user: this.user.getSanitizedObject() };
			if (this.confirmationCheat === this.api.config.secrets.confirmationCheat) {
				// this allows for testing without actually receiving the email
				this.log('Confirmation cheat detected, hopefully this was called by test code');
				this.responseData.user.confirmationCode = this.user.get('confirmationCode');
			}
			if (this.accessToken) {
				this.responseData.accessToken = this.accessToken;
			}
			callback();
		});
	}

	allow (callback) {
		this.confirmationCheat = this.request.body._confirmationCheat;	// cheat code for testing only
		delete this.request.body._confirmationCheat;
		this.allowParameters(
			'body',
			{
				string: ['email', 'password', 'username', 'firstName', 'lastName'],
				number: ['timeout'],
				'array(string)': ['secondaryEmails']
			},
			callback
		);
	}

	require (callback) {
		this.requireParameters(
			'body',
			['email', 'password', 'username'],
			callback
		);
	}

	generateConfirmCode (callback) {
		if (!this.confirmationRequired) {
			this.log('Note: confirmation not required in environment - THIS SHOULD NOT BE PRODUCTION - email will be automatically confirmed');
			this.request.body.isRegistered = true;
			return callback();
		}
		this.request.body.confirmationCode = ConfirmCode();
		this.request.body.confirmationAttempts = 0;
		let timeout = this.request.body.timeout || CONFIRMATION_CODE_TIMEOUT;
		timeout = Math.min(timeout, CONFIRMATION_CODE_TIMEOUT);
		this.request.body.confirmationCodeExpiresAt = Date.now() + timeout;
		delete this.request.body.timeout;
		process.nextTick(callback);
	}

	generateToken (callback) {
		if (this.confirmationRequired) {
			return callback();
		}
		Tokenizer(
			this.user.attributes,
			this.api.config.secrets.auth,
			(error, token) => {
				if (error) {
					return callback(this.errorHandler.error('token', { reason: error }));
				}
				this.request.body.accessToken = this.accessToken = token;
				process.nextTick(callback);
			}
		);
	}

	saveUser (callback) {
		this.userCreator = new UserCreator({
			request: this,
			notOkIfExistsAndRegistered: true
		});
		this.userCreator.createUser(
			this.request.body,
			(error, user) => {
				if (error) { return callback(error); }
				this.user = user;
				callback();
			}
		);
	}

	sendEmail (callback) {
		if (!this.confirmationRequired) {
			return callback();
		}
		this.api.services.email.sendConfirmationEmail(
			{
				user: this.user.attributes,
				email: this.user.get('email'),
				request: this
			},
			callback
		);
	}
}

module.exports = RegisterRequest;
