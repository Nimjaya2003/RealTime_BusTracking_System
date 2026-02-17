const trackingService = require('../services/tracking.service');

const start = async (req, res) => {
	try {
		const result = await trackingService.startDriverTracking(req.user.uid);
		res.status(200).json({ message: 'Background tracking started', data: result });
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

const stop = async (req, res) => {
	try {
		const result = trackingService.stopDriverTracking(req.user.uid);
		if (!result) return res.status(404).json({ message: 'No active tracker to stop' });
		res.status(200).json({ message: 'Background tracking stopped', data: result });
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

const ping = async (req, res) => {
	try {
		const { latitude, longitude, speedKph, headingDeg } = req.body;

		if (latitude === undefined || longitude === undefined) {
			return res.status(400).json({ message: 'latitude and longitude are required' });
		}

		const latNum = Number(latitude);
		const lngNum = Number(longitude);
		const speedNum = speedKph !== undefined ? Number(speedKph) : undefined;
		const headingNum = headingDeg !== undefined ? Number(headingDeg) : undefined;

		if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
			return res.status(400).json({ message: 'latitude and longitude must be numbers' });
		}

		const result = await trackingService.pingLocation(req.user.uid, {
			latitude: latNum,
			longitude: lngNum,
			speedKph: Number.isFinite(speedNum) ? speedNum : null,
			headingDeg: Number.isFinite(headingNum) ? headingNum : null,
		});

		res.status(200).json({ message: 'Location stored and synced', data: result });
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

const status = (req, res) => {
	const result = trackingService.getStatus(req.user.uid);
	res.status(200).json({ data: result });
};

module.exports = {
	start,
	stop,
	ping,
	status,
};
