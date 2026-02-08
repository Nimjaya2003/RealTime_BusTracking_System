const busModel = require('../models/bus.model');

const createBus = async (req, res) => {
	try {
		const { name, plateNumber, capacity, routeId, driverId, status } = req.body;

		if (!name || !plateNumber) {
			return res.status(400).json({ message: 'name and plateNumber are required' });
		}

		const bus = await busModel.createBus({ name, plateNumber, capacity, routeId, driverId, status });
		res.status(201).json({ message: 'Bus created', data: bus });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getBus = async (req, res) => {
	try {
		const bus = await busModel.getBusById(req.params.id);
		if (!bus) return res.status(404).json({ message: 'Bus not found' });
		res.json({ data: bus });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const listBuses = async (req, res) => {
	try {
		const { routeId, status } = req.query;
		const buses = await busModel.listBuses({ routeId, status });
		res.json({ data: buses });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const updateBus = async (req, res) => {
	try {
		const bus = await busModel.getBusById(req.params.id);
		if (!bus) return res.status(404).json({ message: 'Bus not found' });

		const updated = await busModel.updateBus(req.params.id, {
			name: req.body.name,
			plateNumber: req.body.plateNumber,
			capacity: req.body.capacity,
			routeId: req.body.routeId,
			driverId: req.body.driverId,
			status: req.body.status
		});

		res.json({ message: 'Bus updated', data: updated });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const deleteBus = async (req, res) => {
	try {
		const deleted = await busModel.deleteBus(req.params.id);
		if (!deleted) return res.status(404).json({ message: 'Bus not found' });
		res.json({ message: 'Bus deleted' });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const updateLocation = async (req, res) => {
	try {
		const { latitude, longitude, speedKph, headingDeg } = req.body;
		if (latitude === undefined || longitude === undefined) {
			return res.status(400).json({ message: 'latitude and longitude are required' });
		}

		const latNum = Number(latitude);
		const lngNum = Number(longitude);
		if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
			return res.status(400).json({ message: 'latitude and longitude must be numbers' });
		}

		const bus = await busModel.getBusById(req.params.id);
		if (!bus) return res.status(404).json({ message: 'Bus not found' });

		// Ensure driver updates only own bus when driver_id is set
		if (bus.driver_id && req.user?.userId && bus.driver_id !== req.user.userId) {
			return res.status(403).json({ message: 'This bus is assigned to another driver' });
		}

		await busModel.updateBusLocation(req.params.id, {
			latitude: latNum,
			longitude: lngNum,
			speedKph,
			headingDeg
		});

		const updated = await busModel.getBusById(req.params.id);
		res.json({ message: 'Location updated', data: updated });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const findNearby = async (req, res) => {
	try {
		const { lat, lng, radiusKm, limit, routeId } = req.query;

		if (lat === undefined || lng === undefined) {
			return res.status(400).json({ message: 'lat and lng are required query params' });
		}

		const latNum = Number(lat);
		const lngNum = Number(lng);
		const radiusNum = radiusKm ? Number(radiusKm) : 5;
		const limitNum = limit ? Number(limit) : 5;

		if (![latNum, lngNum, radiusNum, limitNum].every(Number.isFinite)) {
			return res.status(400).json({ message: 'lat, lng, radiusKm, limit must be valid numbers' });
		}

		const buses = await busModel.findNearbyBuses({
			lat: latNum,
			lng: lngNum,
			radiusKm: radiusNum,
			limit: limitNum,
			routeId: routeId ? Number(routeId) : undefined
		});

		res.json({ data: buses });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	createBus,
	getBus,
	listBuses,
	updateBus,
	deleteBus,
	updateLocation,
	findNearby
};
