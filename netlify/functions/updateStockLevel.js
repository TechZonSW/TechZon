// netlify/functions/updateStockLevel.js
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
    // Säkerhetskontroller
    if (event.httpMethod !== 'POST') return { statusCode: 405 };
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401 };
    const token = authHeader.split(' ')[1];
    try { jwt.verify(token, process.env.JWT_SECRET); }
    catch (error) { return { statusCode: 403 };}

    try {
        const { productId, action, value } = JSON.parse(event.body);
        if (!productId || !action) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Produkt-ID och åtgärd krävs.' }) };
        }

        const stockRef = db.collection('Lager').doc(productId);

        if (action === 'decrement') {
            // Minska saldot med 1 (atomisk operation)
            await stockRef.update({ saldo: admin.firestore.FieldValue.increment(-1) });
        } else if (action === 'set') {
            // Sätt ett exakt nytt saldo
            const newValue = parseInt(value, 10);
            if (isNaN(newValue)) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Ogiltigt värde för saldo.' }) };
            }
            await stockRef.set({ saldo: newValue }, { merge: true }); // .set() med merge skapar dokumentet om det inte finns
        } else {
            return { statusCode: 400, body: JSON.stringify({ message: 'Okänd åtgärd.' }) };
        }

        // Hämta det nya, uppdaterade saldot för att skicka tillbaka
        const updatedDoc = await stockRef.get();
        const newSaldo = updatedDoc.exists ? updatedDoc.data().saldo : 0;

        return { statusCode: 200, body: JSON.stringify({ message: 'Lagersaldo uppdaterat!', newSaldo: newSaldo }) };
    } catch (error) {
        console.error("Error updating stock level:", error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Kunde inte uppdatera lagersaldo.' }) };
    }
};