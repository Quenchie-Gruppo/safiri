// firebase.js
// const admin = require('firebase-admin');
// const serviceAccount = require('./serviceAccountKey.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// module.exports = admin;

// firebase.js
const admin = require('firebase-admin');
const fs = require('fs');

// Get JSON string from env
const firebaseConfig = process.env.FIREBASE_CONFIG;

if (!firebaseConfig) {
  throw new Error('FIREBASE_CONFIG environment variable is missing');
}

// Write it to a temp file
fs.writeFileSync('./serviceAccountKey.json', firebaseConfig);

// Now require the written file
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
