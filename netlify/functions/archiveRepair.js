// netlify/functions/archiveRepair.js

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
    // Endast POST-metod tillåten
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
        const { repairId } = JSON.parse(event.body);
        if (!repairId) {
            return { statusCode: 400, body: 'Repair ID saknas.' };
        }

        const repairRef = db.collection('Reparationer').doc(repairId);
        
        // Uppdatera status-fältet till 'archived'
        await repairRef.update({
            status: 'archived'
        });

        // Lägg även till en notis i historiken
        await repairRef.update({
            status_history: admin.firestore.FieldValue.arrayUnion({
                status: 'Ärende arkiverat',
                timestamp: new Date()
            })
        });

        return { statusCode: 200, body: JSON.stringify({ message: 'Ärendet har arkiverats.' }) };
    } catch (error) {
        console.error("Error archiving repair:", error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Kunde inte arkivera ärendet.' }) };
    }
};
