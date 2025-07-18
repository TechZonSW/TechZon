// netlify/functions/createRepair.js

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

// Hjälpfunktion för att generera en slumpmässig kod
const generateRepairCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'KAL-';
  for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

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
    // Om token är giltig, fortsätter koden. Annars kastas ett fel.
  } catch (error) {
    return { statusCode: 403, body: JSON.stringify({ message: 'Ogiltig token. Åtkomst nekad.' }) };
  }
  // =================================================================
  // SLUT PÅ JWT-SÄKERHETSKONTROLL
  // =================================================================
  
  const { deviceName, customerName, customerPhone } = JSON.parse(event.body);

  const newRepair = {
    device_name: deviceName,
    customer_name: customerName,
    customer_phone: customerPhone,
    repair_code: generateRepairCode(),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    status_history: [{
      status: 'Ärende registrerat',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }]
  };

  try {
    const docRef = await db.collection('Reparationer').add(newRepair);
    // Hämta den nyskapade reparationen för att returnera den fullständiga datan
    const newDoc = await docRef.get();
    const newDocData = newDoc.data();
    
    // Inkludera dokument-ID:t i svaret, det är viktigt för framtida uppdateringar
    return { statusCode: 200, body: JSON.stringify({ id: newDoc.id, ...newDocData }) };

  } catch (error) {
    console.error("Error creating repair:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Kunde inte skapa reparation."}) };
  }
};
