// netlify/functions/deleteRepairs.js

const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// --- START PÅ KORREKT INITIERINGSBLOCK ---
// Hämta Firebase-autentiseringsuppgifter från Netlifys miljövariabler
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Ersätter escape-tecken för radbrytningar
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initiera Firebase Admin SDK, men bara om det inte redan har gjorts
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
// --- SLUT PÅ KORREKT INITIERINGSBLOCK ---

exports.handler = async (event) => {
    // Endast POST-metod med 'DELETE'-liknande intention
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // JWT-säkerhetskontroll...
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401, body: 'Åtkomst nekad' };
    const token = authHeader.split(' ')[1];
    try { jwt.verify(token, process.env.JWT_SECRET); }
    catch (error) { return { statusCode: 403, body: 'Ogiltig token' };}

    try {
        const { repairIds } = JSON.parse(event.body);
        if (!repairIds || !Array.isArray(repairIds) || repairIds.length === 0) {
            return { statusCode: 400, body: 'En lista med Repair IDs krävs.' };
        }

        // Använd en "batch write" för att effektivt radera flera dokument
        const batch = db.batch();
        repairIds.forEach(id => {
            const docRef = db.collection('Reparationer').doc(id);
            batch.delete(docRef);
        });

        await batch.commit();

        return { statusCode: 200, body: JSON.stringify({ message: `${repairIds.length} ärende(n) har raderats permanent.` }) };
    } catch (error) {
        console.error("Error deleting repairs:", error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Kunde inte radera ärenden.' }) };
    }
};
