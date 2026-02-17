const db = require('../config/db');

const createBus = async ({
	name,
	plateNumber,
	capacity,
	routeId,
	driverId,
	status = 'ACTIVE'
}) => {
	const [result] = await db.execute(
		`INSERT INTO buses (name, plate_number, capacity, route_id, driver_id, status)
		 VALUES (?, ?, ?, ?, ?, ?)` ,
		[name, plateNumber, capacity || null, routeId || null, driverId || null, status]
	);
	return getBusById(result.insertId);
};

const getBusById = async (id) => {
	const [rows] = await db.execute(
		'SELECT * FROM buses WHERE id = ? LIMIT 1',
		[id]
	);
	return rows[0] || null;
};

const getBusByDriverId = async (driverId) => {
	const [rows] = await db.execute(
		'SELECT * FROM buses WHERE driver_id = ? LIMIT 1',
		[driverId]
	);
	return rows[0] || null;
};

const listBuses = async ({ routeId, status }) => {
	const conditions = [];
	const params = [];

	if (routeId) {
		conditions.push('route_id = ?');
		params.push(routeId);
	}

	if (status) {
		conditions.push('status = ?');
		params.push(status);
	}

	const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

	const [rows] = await db.execute(
		`SELECT * FROM buses ${where} ORDER BY id DESC`,
		params
	);

	return rows;
};

const updateBus = async (id, data) => {
	const fields = [];
	const params = [];

	if (data.name !== undefined) {
		fields.push('name = ?');
		params.push(data.name);
	}
	if (data.plateNumber !== undefined) {
		fields.push('plate_number = ?');
		params.push(data.plateNumber);
	}
	if (data.capacity !== undefined) {
		fields.push('capacity = ?');
		params.push(data.capacity);
	}
	if (data.routeId !== undefined) {
		fields.push('route_id = ?');
		params.push(data.routeId);
	}
	if (data.driverId !== undefined) {
		fields.push('driver_id = ?');
		params.push(data.driverId);
	}
	if (data.status !== undefined) {
		fields.push('status = ?');
		params.push(data.status);
	}

	if (!fields.length) return getBusById(id);

	params.push(id);

	await db.execute(
		`UPDATE buses SET ${fields.join(', ')} WHERE id = ?`,
		params
	);

	return getBusById(id);
};

const deleteBus = async (id) => {
	const [result] = await db.execute('DELETE FROM buses WHERE id = ?', [id]);
	return result.affectedRows > 0;
};

const updateBusLocation = async (id, {
	latitude,
	longitude,
	speedKph = null,
	headingDeg = null
}) => {
	const [result] = await db.execute(
		`UPDATE buses
		 SET current_latitude = ?,
			 current_longitude = ?,
			 speed_kph = ?,
			 heading_deg = ?,
			 last_ping_at = NOW()
		 WHERE id = ?`,
		[latitude, longitude, speedKph, headingDeg, id]
	);
	return result.affectedRows > 0;
};

const findNearbyBuses = async ({ lat, lng, radiusKm = 5, limit = 5, routeId }) => {
	const conditions = ['current_latitude IS NOT NULL', 'current_longitude IS NOT NULL'];
	const params = [lat, lng, lat];

	if (routeId) {
		conditions.push('route_id = ?');
		params.push(routeId);
	}

	const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

	const [rows] = await db.execute(
		`SELECT *,
			(6371 * ACOS(
				COS(RADIANS(?))
				* COS(RADIANS(current_latitude))
				* COS(RADIANS(current_longitude) - RADIANS(?))
				+ SIN(RADIANS(?))
				* SIN(RADIANS(current_latitude))
			)) AS distance_km
		 FROM buses
		 ${where}
		 HAVING distance_km <= ?
		 ORDER BY distance_km ASC
		 LIMIT ?`,
		[...params, radiusKm, limit]
	);

	return rows;
};

module.exports = {
	createBus,
	getBusById,
	getBusByDriverId,
	listBuses,
	updateBus,
	deleteBus,
	updateBusLocation,
	findNearbyBuses
};


