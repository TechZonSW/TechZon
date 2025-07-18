// netlify/functions/updateRepairStatus.js

const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// =================================================================
// START PÅ FIREBASE-INITIERING
// =================================================================

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

// =================================================================
// SLUT PÅ FIREBASE-INITIERING
// =================================================================

exports.handler = async (event) => {
  // =================================================================
  // START PÅ JWT-SÄKERHETSKONTROLL
  // =================================================================
  const authHeader = event.headers.authorization;
  if (!authHeader) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Ingen token angiven. Åtkomst nekad.' }) };
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return { statusCode: 403, body: JSON.stringify({ message: 'Ogiltig token. Åtkomst nekad.' }) };
  }
  // =================================================================
  // SLUT PÅ JWT-SÄKERHETSKONTROLL
  // =================================================================

  const { repairId, newStatus } = JSON.parse(event.body);

  if (!repairId || !newStatus) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Repair ID och ny status krävs.'}) };
  }

  try {
    const repairRef = db.collection('Reparationer').doc(repairId);
    
    await repairRef.update({
      status_history: admin.firestore.FieldValue.arrayUnion({
        status: newStatus,
        timestamp: new Date()
      })
    });

    return { statusCode: 200, body: JSON.stringify({ message: 'Status uppdaterad!' }) };
  } catch (error) {
    console.error("Error updating status:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Kunde inte uppdatera status."}) };
  }
};
