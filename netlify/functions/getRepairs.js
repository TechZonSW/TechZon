// netlify/functions/getRepairs.js

const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// =================================================================
// START PÅ KORREKT FIREBASE-INITIERING (SAKNADES TIDIGARE)
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
    // JWT-säkerhetskontroll
    const authHeader = event.headers.authorization;
    if (!authHeader) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Åtkomst nekad' }) };
    }
    
    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return { statusCode: 403, body: JSON.stringify({ message: 'Ogiltig token' }) };
    }

    try {
        // Sorterar efter när ärendet skapades, med det nyaste först
        const snapshot = await db.collection('Reparationer').orderBy('created_at', 'desc').get();
        const repairs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return { statusCode: 200, body: JSON.stringify(repairs) };
    } catch (error) {
        // VIKTIGT: Lägg till en logg här för att se databasfel, t.ex. index-fel
        console.error("Firestore query failed:", error); 
        return { statusCode: 500, body: JSON.stringify({ message: 'Kunde inte hämta ärenden från databasen.' }) };
    }
};
