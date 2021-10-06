// handle the "GET /users" request to fetch several users

'use strict';

const GetManyRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/get_many_request');
const Indexes = require('./indexes');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

class GetUsersRequest extends GetManyRequest {

	async authorize () {
		if (this.request.query.codeErrorId) {
			// fetch users who are followers of this code error
			this.codeError = await this.data.codeErrors.getById(this.request.query.codeErrorId.toLowerCase());
			if (!this.codeError) {
				throw this.errorHandler.error('notFound', { info: 'code error' });
			}
			if (!(this.codeError.get('followerIds') || []).includes(this.user.id)) {
				throw this.errorHandler.error('readAuth', { reason: 'user is not a follower of this object' });
			}
		} else {
			// members of the same team can fetch each other
			await this.user.authorizeFromTeamId(this.request.query, this);
		}
	}

	// called before the fetch query
	async preQueryHook () {
		if (this.codeError) { return; }

		// we need the members of the team, since this includes removed users who would otherwise not
		// show up as on the team at all
		this.team = await this.data.teams.getById(this.request.query.teamId.toLowerCase());
		if (!this.team) {
			// shouldn't really happen, as we would have already authorized against the team
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// build the query for fetching the users, based on input parameters
	buildQuery () {
		let ids;
		if (this.codeError) {
			// can get users following a code error
			ids = this.codeError.get('followerIds') || [];
		} else {
			// or users from the team
			ids = this.team.get('memberIds') || [];
		}

		// can also specify individual IDs as a subset
		if (this.request.query.ids) {
			const queryIds = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
			ids = ArrayUtilities.intersection(ids, queryIds);
		}
		
		return { id: this.data.users.inQuerySafe(ids) };
	}

	// get options to use in the query to fetch users
	getQueryOptions () {
		// provide appropriate index, by team
		return { hint: Indexes.byId };
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.access = 'User must be a member of the team for which users are being fetched';
		description.description = 'Fetch the users for a team',
		description.input.looksLike['teamId*'] = '<ID of the team for which users are being fetched>';
		return description;
	}
}

module.exports = GetUsersRequest;
