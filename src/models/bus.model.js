// Firestore-backed Bus model (replaces legacy SQL implementation)
const admin = require('../config/firebase');

const busesCol = admin.firestore().collection('buses');

const serverTs = () => admin.firestore.FieldValue.serverTimestamp();

const createBus = async ({
  name,
  plateNumber,
  capacity,
  routeId,
  driverId,
  status = 'ACTIVE',
}) => {
  const payload = {
    name,
    plateNumber,
    capacity: capacity ?? null,
    routeId: routeId ?? null,
    driverId: driverId ?? null,
    status,
    createdAt: serverTs(),
  };

  const ref = await busesCol.add(payload);
  const snap = await ref.get();
  return { id: ref.id, ...snap.data() };
};

const getBusById = async (id) => {
  const snap = await busesCol.doc(id).get();
  return snap.exists ? { id, ...snap.data() } : null;
};

const getBusByDriverId = async (driverId) => {
  if (!driverId) return null;

  let snaps = await busesCol.where('driverId', '==', driverId).limit(1).get();
  if (!snaps.empty) {
    const doc = snaps.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // Support legacy numeric driver ids stored during migration (uid format: legacy_123)
  const legacyMatch = /^legacy_(\d+)$/.exec(driverId);
  if (legacyMatch) {
    const legacyId = Number(legacyMatch[1]);
    snaps = await busesCol.where('driverLegacyId', '==', legacyId).limit(1).get();
    if (!snaps.empty) {
      const doc = snaps.docs[0];
      return { id: doc.id, ...doc.data() };
    }
  }

  return null;
};

const listBuses = async ({ routeId, status } = {}) => {
  let q = busesCol;
  if (routeId) q = q.where('routeId', '==', routeId);
  if (status) q = q.where('status', '==', status);
  const snaps = await q.get();
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const updateBus = async (id, data) => {
  await busesCol.doc(id).update({ ...data, updatedAt: serverTs() });
  return getBusById(id);
};

const deleteBus = async (id) => {
  await busesCol.doc(id).delete();
  return true;
};

const updateBusLocation = async (id, { latitude, longitude, speedKph = null, headingDeg = null }) => {
  await busesCol.doc(id).update({
    currentLatitude: latitude,
    currentLongitude: longitude,
    speedKph,
    headingDeg,
    lastPingAt: serverTs(),
    updatedAt: serverTs(),
  });
  return getBusById(id);
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const findNearbyBuses = async ({ lat, lng, radiusKm = 5, limit = 5, routeId }) => {
  let q = busesCol;
  if (routeId) q = q.where('routeId', '==', routeId);
  const snaps = await q.get();

  const withDistances = snaps.docs
    .map((d) => {
      const data = d.data();
      if (data.currentLatitude == null || data.currentLongitude == null) return null;
      const distanceKm = haversineKm(lat, lng, data.currentLatitude, data.currentLongitude);
      return { id: d.id, ...data, distanceKm };
    })
    .filter(Boolean)
    .filter((b) => b.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return withDistances;
};

module.exports = {
  createBus,
  getBusById,
  getBusByDriverId,
  listBuses,
  updateBus,
  deleteBus,
  updateBusLocation,
  findNearbyBuses,
};