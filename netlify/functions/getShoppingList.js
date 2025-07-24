// netlify/functions/getShoppingList.js
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
    // Säkerhetskontroller...
    if (event.httpMethod !== 'GET') return { statusCode: 405 };
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401, body: 'Åtkomst nekad' };
    const token = authHeader.split(' ')[1];
    try { jwt.verify(token, process.env.JWT_SECRET); }
    catch (error) { return { statusCode: 403, body: 'Ogiltig token' };}

    try {
        const snapshot = await db.collection('Lager').get();
        if (snapshot.empty) {
            return { statusCode: 200, body: JSON.stringify([]) }; // Returnera en tom lista
        }
        
        const productsToOrder = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const saldo = data.saldo || 0;
            const min_saldo = data.min_saldo || 0;

            // Huvudlogiken: Om saldot är lika med eller mindre än miniminivån
            if (saldo <= min_saldo) {
                productsToOrder.push({
                    id: doc.id,
                    saldo: saldo,
                    min_saldo: min_saldo
                });
            }
        });

        // Returnera listan med bara de produkter som behöver beställas
        return { statusCode: 200, body: JSON.stringify(productsToOrder) };

    } catch (error) {
        console.error("Error generating shopping list:", error);
        return { statusCode: 500, body: 'Kunde inte generera inköpslista.' };
    }
};