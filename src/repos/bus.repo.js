// src/repos/bus.repo.js
const admin = require('../config/firebase');
const col = admin.firestore().collection('buses');

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const create = async (data) => {
  const ref = await col.add({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  const snap = await ref.get();
  return { id: ref.id, ...snap.data() };
};

const get = async (id) => {
  const snap = await col.doc(id).get();
  return snap.exists ? { id, ...snap.data() } : null;
};

const getByDriverId = async (driverId) => {
  if (!driverId) return null;

  // Primary: match exact driverId (Firebase uid)
  let snaps = await col.where('driverId', '==', driverId).limit(1).get();
  if (!snaps.empty) {
    const doc = snaps.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // Fallback: if uid looks like legacy_<number>, match driverLegacyId (from migration)
  const legacyMatch = /^legacy_(\d+)$/.exec(driverId);
  if (legacyMatch) {
    const legacyId = Number(legacyMatch[1]);
    snaps = await col.where('driverLegacyId', '==', legacyId).limit(1).get();
    if (!snaps.empty) {
      const doc = snaps.docs[0];
      return { id: doc.id, ...doc.data() };
    }
  }

  return null;
};

const list = async (filters = {}) => {
  let q = col;
  if (filters.routeId) q = q.where('routeId', '==', filters.routeId);
  if (filters.status) q = q.where('status', '==', filters.status);
  const snaps = await q.get();
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const update = async (id, data) => {
  await col.doc(id).update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return get(id);
};

const updateLocation = async (id, data) => {
  await col.doc(id).update({
    ...data,
    lastPingAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return get(id);
};

const findNearby = async ({ lat, lng, radiusKm = 5, limit = 5, routeId }) => {
  let q = col;
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

const remove = async (id) => {
  await col.doc(id).delete();
  return true;
};

module.exports = { create, get, list, update, remove };
module.exports.updateLocation = updateLocation;
module.exports.findNearby = findNearby;
module.exports.getByDriverId = getByDriverId;