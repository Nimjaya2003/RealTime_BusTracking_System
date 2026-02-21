// Firebase Auth + Firestore-backed User model (replaces legacy SQL implementation)
const admin = require('../config/firebase');

const usersCol = admin.firestore().collection('users');
const serverTs = () => admin.firestore.FieldValue.serverTimestamp();

// Creates an auth user and a profile document; expects password to be a plain text password
// because Firebase Auth hashes internally. If you need to import bcrypt hashes, use the
// Firebase Admin importUsers API instead (see previous migration script).
const createUser = async (name, email, password, role = 'PASSENGER') => {
  const userRecord = await admin.auth().createUser({ displayName: name, email, password });
  const normalizedRole = (role || 'PASSENGER').toUpperCase();
  await admin.auth().setCustomUserClaims(userRecord.uid, { role: normalizedRole });

  await usersCol.doc(userRecord.uid).set({
    uid: userRecord.uid,
    name,
    email,
    role: normalizedRole,
    createdAt: serverTs(),
  });

  return { uid: userRecord.uid, name, email, role: normalizedRole };
};

const findUserByEmail = async (email) => {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const profileSnap = await usersCol.doc(userRecord.uid).get();
    const profile = profileSnap.exists ? profileSnap.data() : {};
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName,
      role: profile.role || userRecord.customClaims?.role || 'PASSENGER',
    };
  } catch (err) {
    if (err.code === 'auth/user-not-found') return null;
    throw err;
  }
};

module.exports = { createUser, findUserByEmail };