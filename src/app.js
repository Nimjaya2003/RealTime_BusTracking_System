const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const testRoutes = require('./routes/test.routes');
const busRoutes = require('./routes/bus.routes');
const routeRoutes = require('./routes/route.routes');
const trackingRoutes = require('./routes/tracking.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/buses', busRoutes);
app.use('/api/v1/routes', routeRoutes);
app.use('/api/v1/tracking', trackingRoutes);



module.exports = app;