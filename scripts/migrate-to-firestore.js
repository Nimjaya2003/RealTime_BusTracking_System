// scripts/migrate-to-firestore.js
// scripts/migrate-to-firestore.js
// One-time migration from MySQL to Firestore + Firebase Auth
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const admin = require('../src/config/firebase');
const dbSql = require('../src/config/db');

const fstore = admin.firestore();

const migrateRoutes = async () => {
  const [rows] = await dbSql.execute('SELECT * FROM routes');
  const batch = fstore.batch();
  rows.forEach((r) => {
    const ref = fstore.collection('routes').doc();
    batch.set(ref, {
      legacyId: r.id,
      name: r.name,
      startLatitude: r.start_latitude,
      startLongitude: r.start_longitude,
      endLatitude: r.end_latitude,
      endLongitude: r.end_longitude,
      description: r.description || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
  console.log(`Migrated ${rows.length} routes`);
};

const migrateBuses = async () => {
  const [rows] = await dbSql.execute('SELECT * FROM buses');
  const batch = fstore.batch();
  rows.forEach((b) => {
    const ref = fstore.collection('buses').doc();
    batch.set(ref, {
      legacyId: b.id,
      name: b.name,
      plateNumber: b.plate_number,
      capacity: b.capacity,
      routeLegacyId: b.route_id || null,
      driverLegacyId: b.driver_id || null,
      status: b.status || 'ACTIVE',
      currentLatitude: b.current_latitude,
      currentLongitude: b.current_longitude,
      speedKph: b.speed_kph,
      headingDeg: b.heading_deg,
      lastPingAt: b.last_ping_at ? new Date(b.last_ping_at) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
  console.log(`Migrated ${rows.length} buses`);
};

const migrateUsers = async () => {
  const [rows] = await dbSql.execute('SELECT * FROM users');

  // Import auth users using bcrypt hashes
  const importRecords = rows.map((u) => ({
    uid: `legacy_${u.id}`,
    email: u.email,
    displayName: u.name,
    passwordHash: Buffer.from(u.password),
  }));

  const result = await admin.auth().importUsers(importRecords, {
    hash: { algorithm: 'BCRYPT' },
  });

  if (result.failureCount > 0) {
    console.warn('Some users failed to import:', result.errors);
  }

  // Set custom claims and Firestore profile docs
  await Promise.all(
    rows.map(async (u) => {
      const uid = `legacy_${u.id}`;
      const role = (u.role || 'PASSENGER').toUpperCase();
      try {
        await admin.auth().setCustomUserClaims(uid, { role });
      } catch (err) {
        console.warn(`Failed to set claims for ${uid}:`, err.message);
      }

      await fstore.collection('users').doc(uid).set({
        uid,
        legacyId: u.id,
        name: u.name,
        email: u.email,
        role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    })
  );

  console.log(`Migrated ${rows.length} users (auth + profiles)`);
};

const main = async () => {
  await migrateRoutes();
  await migrateBuses();
  await migrateUsers();
  process.exit(0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});