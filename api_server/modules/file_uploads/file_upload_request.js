// fulfill an upload-file request to support file upload and storage

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');

class UploadFileRequest extends RestfulRequest {

	// authorize the client (the inbound email server) to make this request
	async authorize () {
		// user must be a member of the team for which the file is being uploaded
		if (!this.user.hasTeam(this.request.params.teamId.toLowerCase())) {
			throw this.errorHandler.error('createAuth', { reason: 'user is not a member of this team' });
		}
	}

	async handleResponse () {
		if (this.gotError) { return super.handleResponse(); }

		// ignore all but the first file
		const file = this.request.files[0];
		const { publicUrl } = this.request.api.config.uploadEngine.s3;
		this.responseData = {
			url: `${publicUrl}/${file.key}`,
			name: file.originalname,
			type: file.mimetype,
			size: file.size
		};
		return super.handleResponse();
	}
}

module.exports = UploadFileRequest;
