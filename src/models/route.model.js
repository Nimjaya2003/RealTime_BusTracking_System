const db = require('../config/db');

const createRoute = async ({
	name,
	startLatitude,
	startLongitude,
	endLatitude,
	endLongitude,
	description = null
}) => {
	const [result] = await db.execute(
		`INSERT INTO routes (name, start_latitude, start_longitude, end_latitude, end_longitude, description)
		 VALUES (?, ?, ?, ?, ?, ?)` ,
		[name, startLatitude, startLongitude, endLatitude, endLongitude, description]
	);
	return getRouteById(result.insertId);
};

const getRouteById = async (id) => {
	const [rows] = await db.execute(
		'SELECT * FROM routes WHERE id = ? LIMIT 1',
		[id]
	);
	return rows[0] || null;
};

const listRoutes = async () => {
	const [rows] = await db.execute(
		'SELECT * FROM routes ORDER BY id DESC'
	);
	return rows;
};

const updateRoute = async (id, data) => {
	const fields = [];
	const params = [];

	if (data.name !== undefined) {
		fields.push('name = ?');
		params.push(data.name);
	}
	if (data.startLatitude !== undefined) {
		fields.push('start_latitude = ?');
		params.push(data.startLatitude);
	}
	if (data.startLongitude !== undefined) {
		fields.push('start_longitude = ?');
		params.push(data.startLongitude);
	}
	if (data.endLatitude !== undefined) {
		fields.push('end_latitude = ?');
		params.push(data.endLatitude);
	}
	if (data.endLongitude !== undefined) {
		fields.push('end_longitude = ?');
		params.push(data.endLongitude);
	}
	if (data.description !== undefined) {
		fields.push('description = ?');
		params.push(data.description);
	}

	if (!fields.length) return getRouteById(id);

	params.push(id);

	await db.execute(
		`UPDATE routes SET ${fields.join(', ')} WHERE id = ?`,
		params
	);

	return getRouteById(id);
};

const deleteRoute = async (id) => {
	const [result] = await db.execute('DELETE FROM routes WHERE id = ?', [id]);
	return result.affectedRows > 0;
};

module.exports = {
	createRoute,
	getRouteById,
	listRoutes,
	updateRoute,
	deleteRoute
};
