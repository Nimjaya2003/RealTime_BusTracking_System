const admin = require('../config/firebase');
const col = admin.firestore().collection('routes');

const create = async (data) => {
  const ref = await col.add({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  const snap = await ref.get();
  return { id: ref.id, ...snap.data() };
};

const get = async (id) => {
  const snap = await col.doc(id).get();
  return snap.exists ? { id, ...snap.data() } : null;
};

const list = async () => {
  const snaps = await col.orderBy('createdAt', 'desc').get().catch(async (err) => {
    // If createdAt is missing on some docs, fall back to unordered fetch
    if (err.code === 9 /* failed-precondition */) {
      const fallback = await col.get();
      return fallback;
    }
    throw err;
  });
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const update = async (id, data) => {
  await col.doc(id).update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return get(id);
};

const remove = async (id) => {
  await col.doc(id).delete();
  return true;
};

module.exports = {
  create,
  get,
  list,
  update,
  remove,
};
