// netlify/functions/getRepairs.js

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
    // JWT-säkerhetskontroll
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401, body: 'Åtkomst nekad' };
    const token = authHeader.split(' ')[1];
    try { 
        jwt.verify(token, process.env.JWT_SECRET); 
    } catch (error) { 
        return { statusCode: 403, body: 'Ogiltig token' };
    }

    try {
        const repairStatus = event.queryStringParameters.status || 'active';
        
        const repairsRef = db.collection('Reparationer');
        
        const snapshot = await repairsRef
            .where('status', '==', repairStatus)
            .orderBy('created_at', 'desc')
            .get();
            
        if (snapshot.empty) {
            return { statusCode: 200, body: JSON.stringify([]) }; // Returnera en tom lista om inget hittas
        }

        const repairs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return { statusCode: 200, body: JSON.stringify(repairs) };
    } catch (error) {
        console.error("Firestore query failed:", error); 
        return { statusCode: 500, body: JSON.stringify({ message: 'Kunde inte hämta ärenden från databasen.' }) };
    }
};
