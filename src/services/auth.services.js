const admin = require('../config/firebase');

const fstore = admin.firestore();
const USERS_COLLECTION = 'users';

const registerUser = async (name, email, password, role) => {
    const normalizedRole = (role || 'PASSENGER').toUpperCase();

    // Fail fast if user already exists
    try {
        await admin.auth().getUserByEmail(email);
        throw new Error('User already exists');
    } catch (err) {
        if (err.code !== 'auth/user-not-found') {
            throw err;
        }
    }

    const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { role: normalizedRole });

    await fstore.collection(USERS_COLLECTION).doc(userRecord.uid).set({
        uid: userRecord.uid,
        name,
        email,
        role: normalizedRole,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return true;
};

const loginUser = async (email, password) => {
    if (!process.env.FIREBASE_API_KEY) {
        throw new Error('FIREBASE_API_KEY is not set');
    }

    const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
    );

    const data = await resp.json();

    if (!resp.ok) {
        const message = data.error?.message || 'Invalid email or password';
        throw new Error(message);
    }

    const userRecord = await admin.auth().getUser(data.localId);
    const role = userRecord.customClaims?.role || 'PASSENGER';

    return {
        token: data.idToken,
        refreshToken: data.refreshToken,
        role,
        expiresIn: data.expiresIn,
        uid: data.localId,
    };
};

module.exports = {
    registerUser,
    loginUser,
};

    



    


