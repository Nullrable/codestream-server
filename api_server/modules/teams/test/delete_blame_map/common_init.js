// base class for many tests of the "POST /add-blame-map/:teamId" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 3;
		this.userOptions.numUnregistered = 1;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.createInitialBlameMap,
			this.makeBlameMapData	// make the data to be used during the update
		], callback);
	}
	
	// create an initial blame-map that we will remove from from
	createInitialBlameMap (callback) {
		BoundAsync.timesSeries(
			this,
			3,
			(n, timesCallback) => {
				const whichUser = this.team.memberIds.includes(this.users[n].user.id) ? n : 1;
				const data = {
					email: this.userFactory.randomEmail(),
					userId: this.users[whichUser].user.id
				};
				const emailKey = data.email.replace(/\./g, '*');
				this.doApiRequest(
					{
						method: 'post',
						path: '/add-blame-map/' + this.team.id,
						data,
						token: this.users[1].accessToken
					},
					error => {
						if (error) { return callback(error); }
						this.team.settings = this.team.settings || {};
						this.team.settings.blameMap = this.team.settings.blameMap || {};
						this.team.settings.blameMap[emailKey] = data.userId;
						timesCallback();
					}
				);
			},
			callback
		);
	}

	// form the data for the team update
	makeBlameMapData (callback) {
		this.path = '/delete-blame-map/' + this.team.id;
		const email = this.users[1].user.email;
		const emailKey = email.replace(/\./g, '*');
		this.data = { email };
		this.updatedAt = Date.now();
		this.expectedResponse = {
			team: {
				id: this.team.id,
				_id: this.team.id,
				$unset: {
					[`settings.blameMap.${emailKey}`]: true
				},
				$set: {
					modifiedAt: Date.now(),
					version: 9
				},
				$version: {
					before: 8,
					after: 9
				}
			}
		};
		this.expectedSettings = DeepClone(this.team.settings);
		delete this.expectedSettings.blameMap[emailKey];
		callback();
	}

	// do the actual request
	deleteBlameMap (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/delete-blame-map/' + this.team.id,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.deleteBlameMapResponse = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
