const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Export admin instance
module.exports = admin;
