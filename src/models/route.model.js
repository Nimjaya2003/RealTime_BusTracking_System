// Firestore-backed Route model (replaces legacy SQL implementation)
const admin = require('../config/firebase');

const routesCol = admin.firestore().collection('routes');
const serverTs = () => admin.firestore.FieldValue.serverTimestamp();

const createRoute = async ({ name, startLatitude, startLongitude, endLatitude, endLongitude, description = null }) => {
  const payload = {
    name,
    startLatitude,
    startLongitude,
    endLatitude,
    endLongitude,
    description,
    createdAt: serverTs(),
  };

  const ref = await routesCol.add(payload);
  const snap = await ref.get();
  return { id: ref.id, ...snap.data() };
};

const getRouteById = async (id) => {
  const snap = await routesCol.doc(id).get();
  return snap.exists ? { id, ...snap.data() } : null;
};

const listRoutes = async () => {
  const snaps = await routesCol.orderBy('createdAt', 'desc').get().catch(async (err) => {
    if (err.code === 9 /* failed-precondition when some docs miss createdAt */) {
      return routesCol.get();
    }
    throw err;
  });
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const updateRoute = async (id, data) => {
  await routesCol.doc(id).update({ ...data, updatedAt: serverTs() });
  return getRouteById(id);
};

const deleteRoute = async (id) => {
  await routesCol.doc(id).delete();
  return true;
};

module.exports = {
  createRoute,
  getRouteById,
  listRoutes,
  updateRoute,
  deleteRoute,
};