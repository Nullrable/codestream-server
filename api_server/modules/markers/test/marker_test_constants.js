// test constants for testing the markers module

'use strict';

const MarkerAttributes = require(process.env.CS_API_TOP + '/modules/markers/marker_attributes');
const MarkerLocationsAttributes = require(process.env.CS_API_TOP + '/modules/marker_locations/marker_locations_attributes');

const EXPECTED_MARKER_FIELDS = [
	'_id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'teamId',
	'streamId',
	'postId',
	'numComments',
	'commitHashWhenCreated'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(MarkerAttributes).filter(attribute => {
	return MarkerAttributes[attribute].serverOnly;
});

const UNSANITIZED_MARKER_LOCATIONS_ATTRIBUTES = Object.keys(MarkerLocationsAttributes).filter(attribute => {
	return MarkerLocationsAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_MARKER_FIELDS,
	UNSANITIZED_ATTRIBUTES,
	UNSANITIZED_MARKER_LOCATIONS_ATTRIBUTES
};
