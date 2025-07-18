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
    // JWT-säkerhetskontroll...
    if (event.httpMethod !== 'POST') return { statusCode: 405 };
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401, body: 'Åtkomst nekad' };
    const token = authHeader.split(' ')[1];
    try { jwt.verify(token, process.env.JWT_SECRET); }
    catch (error) { return { statusCode: 403, body: 'Ogiltig token' };}
    
    console.log("--- UpdateRepairStatus Function Started ---");

    try {
        console.log("Received body:", event.body);
        const { repairId, newStatus } = JSON.parse(event.body);

        console.log("Parsed Data -> repairId:", repairId, "| newStatus:", newStatus);

        if (!repairId || !newStatus) {
            console.log("Validation FAILED: repairId or newStatus is missing.");
            return { statusCode: 400, body: JSON.stringify({ message: 'Repair ID och ny status krävs.' }) };
        }

        console.log(`Attempting to find document with ID: ${repairId}`);
        const repairRef = db.collection('Reparationer').doc(repairId);

        // Steg 1: Hämta det nuvarande dokumentet
        const doc = await repairRef.get();
        if (!doc.exists) {
            console.log("Document not found in database.");
            return { statusCode: 404, body: JSON.stringify({ message: 'Ärende hittades ej.' }) };
        }
        console.log("Document found successfully.");

        // Steg 2: Ta den befintliga historiken (eller skapa en tom lista)
        const currentHistory = doc.data().status_history || [];
        console.log(`Current history has ${currentHistory.length} entries.`);

        // Steg 3: Lägg till den nya statusen i listan
        currentHistory.push({
            status: newStatus,
            timestamp: new Date()
        });
        console.log("New status pushed to local history array.");

        // Steg 4: Skriv över hela historik-fältet med den nya, uppdaterade listan
        console.log("Attempting to update document in Firestore...");
        await repairRef.update({
            status_history: currentHistory
        });
        console.log("--- Update Succeeded! ---");

        return { statusCode: 200, body: JSON.stringify({ message: 'Status uppdaterad!' }) };
    } catch (error) {
        console.error("--- CRITICAL ERROR in updateRepairStatus ---", error);
        return { statusCode: 500, body: JSON.stringify({ message: "Kunde inte uppdatera status." }) };
    }
};
