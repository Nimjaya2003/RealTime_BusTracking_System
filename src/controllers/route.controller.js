const routeModel = require('../models/route.model');

const createRoute = async (req, res) => {
    try {
        const { name, startLatitude, startLongitude, endLatitude, endLongitude, description } = req.body;

        if (!name || startLatitude === undefined || startLongitude === undefined || endLatitude === undefined || endLongitude === undefined) {
            return res.status(400).json({ message: 'name, startLatitude, startLongitude, endLatitude, endLongitude are required' });
        }

        const route = await routeModel.createRoute({
            name,
            startLatitude,
            startLongitude,
            endLatitude,
            endLongitude,
            description
        });

        res.status(201).json({ message: 'Route created', data: route });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const listRoutes = async (_req, res) => {
    try {
        const routes = await routeModel.listRoutes();
        res.json({ data: routes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRoute = async (req, res) => {
    try {
        const route = await routeModel.getRouteById(req.params.id);
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json({ data: route });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateRoute = async (req, res) => {
    try {
        const exists = await routeModel.getRouteById(req.params.id);
        if (!exists) return res.status(404).json({ message: 'Route not found' });

        const updated = await routeModel.updateRoute(req.params.id, {
            name: req.body.name,
            startLatitude: req.body.startLatitude,
            startLongitude: req.body.startLongitude,
            endLatitude: req.body.endLatitude,
            endLongitude: req.body.endLongitude,
            description: req.body.description
        });

        res.json({ message: 'Route updated', data: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteRoute = async (req, res) => {
    try {
        const deleted = await routeModel.deleteRoute(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Route not found' });
        res.json({ message: 'Route deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRoute,
    listRoutes,
    getRoute,
    updateRoute,
    deleteRoute
};
