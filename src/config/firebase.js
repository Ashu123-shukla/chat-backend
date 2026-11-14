
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../../chat-backend-firebase-secretKey.json');

const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id
});

// Explicitly connect to the database ID created in Firebase Console
const db = getFirestore(app, 'default');

module.exports = db;
