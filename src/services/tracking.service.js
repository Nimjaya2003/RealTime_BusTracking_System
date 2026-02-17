const admin = require('../config/firebase');
const busRepo = require('../repos/bus.repo');

const INTERVAL_MS = 10_000;
const activeTrackers = new Map(); // driverUid -> { timer, busId }

const pushToRealtimeDb = async (bus) => {
	if (bus.currentLatitude == null || bus.currentLongitude == null) return;

	const payload = {
		latitude: Number(bus.currentLatitude),
		longitude: Number(bus.currentLongitude),
		speedKph: bus.speedKph != null ? Number(bus.speedKph) : null,
		headingDeg: bus.headingDeg != null ? Number(bus.headingDeg) : null,
		updatedAt: Date.now(),
	};

	await admin.database().ref('busLocations').child(String(bus.id)).set(payload);
};

const syncBusLocation = async (busId) => {
	const bus = await busRepo.get(busId);
	if (!bus) {
		throw new Error('Bus not found');
	}
	await pushToRealtimeDb(bus);
};

const startDriverTracking = async (driverUid) => {
	const bus = await busRepo.getByDriverId(driverUid);
	if (!bus) {
		throw new Error('No bus assigned to this driver');
	}

	const existing = activeTrackers.get(driverUid);
	if (existing?.timer) {
		clearInterval(existing.timer);
	}

	const timer = setInterval(async () => {
		try {
			await syncBusLocation(bus.id);
		} catch (err) {
			console.error('tracking sync error', err.message);
		}
	}, INTERVAL_MS);

	activeTrackers.set(driverUid, { timer, busId: bus.id });

	await syncBusLocation(bus.id);

	return { busId: bus.id };
};

const stopDriverTracking = (driverUid) => {
	const existing = activeTrackers.get(driverUid);
	if (!existing) return null;

	clearInterval(existing.timer);
	activeTrackers.delete(driverUid);
	return { busId: existing.busId };
};

const pingLocation = async (driverUid, {
	latitude,
	longitude,
	speedKph,
	headingDeg,
}) => {
	const bus = await busRepo.getByDriverId(driverUid);
	if (!bus) {
		throw new Error('No bus assigned to this driver');
	}

	const updated = await busRepo.updateLocation(bus.id, {
		currentLatitude: latitude,
		currentLongitude: longitude,
		speedKph,
		headingDeg,
	});

	await pushToRealtimeDb(updated);

	return { busId: bus.id, data: updated };
};

const getStatus = (driverUid) => {
	const tracker = activeTrackers.get(driverUid);
	if (!tracker) return { running: false };
	return { running: true, busId: tracker.busId, intervalMs: INTERVAL_MS };
};

module.exports = {
	startDriverTracking,
	stopDriverTracking,
	pingLocation,
	getStatus,
};
