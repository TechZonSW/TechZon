// netlify/functions/getRepairStatus.js

const admin = require('firebase-admin');

// Initiera bara Firebase Admin om den inte redan är initierad
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  const repairCode = event.queryStringParameters.code;

  if (!repairCode) {
    return {
      statusCode: 400, // Bad Request
      body: JSON.stringify({ error: 'Reparationskod saknas.' }),
    };
  }

  try {
    const repairsRef = db.collection('Reparationer');
    const snapshot = await repairsRef.where('repair_code', '==', repairCode).limit(1).get();

    if (snapshot.empty) {
      return {
        statusCode: 404, // Not Found
        body: JSON.stringify({ error: 'Ingen reparation med den koden hittades.' }),
      };
    }

    // Ta första träffen och hämta dess data
    const repairData = snapshot.docs[0].data();

    return {
      statusCode: 200,
      body: JSON.stringify(repairData),
    };
  } catch (error) {
    console.error('Error fetching from Firestore:', error);
    return {
      statusCode: 500, // Internal Server Error
      body: JSON.stringify({ error: 'Ett serverfel inträffade.' }),
    };
  }
};
