// netlify/functions/getStockLevels.js
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// =================================================================
// START PÅ KORREKT FIREBASE-INITIERING
// =================================================================

// Denna kod ser till att vi bara ansluter till Firebase en gång.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      // Denna rad hanterar ett formateringsproblem mellan Netlify och Firebase
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

// Skapa en databas-referens som resten av koden kan använda.
const db = admin.firestore();

// =================================================================
// SLUT PÅ FIREBASE-INITIERING
// =================================================================

exports.handler = async (event) => {
    // JWT-säkerhetskontroll...
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const authHeader = event.headers.authorization;
    if (!authHeader) {
        return { statusCode: 401, body: 'Åtkomst nekad: Token saknas.' };
    }
    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return { statusCode: 403, body: 'Åtkomst nekad: Ogiltig token.' };
    }

    try {
        const snapshot = await db.collection('Lager').get();

        // =================================================================
        // TILLAGD FELSÖKNINGSLOGG
        // Denna rad hjälper oss att se exakt hur många dokument funktionen hittar.
        // =================================================================
        console.log(`[getStockLevels] Found ${snapshot.size} documents in 'Lager' collection.`);
        
        if (snapshot.empty) {
            return { statusCode: 200, body: JSON.stringify({}) };
        }
        
        // Omvandla resultatet till ett enkelt objekt: { "NEW001": 8, "SPA002": 10 }
        const stockLevels = {};
        snapshot.forEach(doc => {
            stockLevels[doc.id] = doc.data().saldo || 0;
        });

        return { statusCode: 200, body: JSON.stringify(stockLevels) };
    } catch (error) {
        console.error("[getStockLevels] CRITICAL ERROR:", error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Kunde inte hämta lagerdata från databasen.' }) };
    }
};