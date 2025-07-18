// netlify/functions/createRepair.js

const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// ... (ditt kompletta initieringsblock ska vara här) ...
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

// Hjälpfunktion för att generera en slumpmässig kod
const generateRepairCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'KAL-';
  for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

exports.handler = async (event) => {
  // JWT-säkerhetskontroll...
  const authHeader = event.headers.authorization;
  if (!authHeader) return { statusCode: 401, body: JSON.stringify({ message: 'Åtkomst nekad.' })};
  const token = authHeader.split(' ')[1];
  try { jwt.verify(token, process.env.JWT_SECRET); } 
  catch (error) { return { statusCode: 403, body: JSON.stringify({ message: 'Ogiltig token.' })};}
  
  const { deviceName, customerName, customerPhone } = JSON.parse(event.body);

  const newRepairData = {
      device_name: deviceName,
      customer_name: customerName,
      customer_phone: customerPhone,
      repair_code: generateRepairCode(),
      created_at: new Date(), // Spara som vanligt JS-datum
      status_history: [
          {
              status: 'Ärende registrerat',
              timestamp: new Date() // Spara som vanligt JS-datum
          }
      ]
  };

  try {
    const docRef = await db.collection('Reparationer').add(newRepairData);
    const newDoc = await docRef.get();
    const createdRepair = newDoc.data();
    
    // Skicka tillbaka dokumentet som det är. Ingen konvertering behövs.
    return { statusCode: 200, body: JSON.stringify({ id: newDoc.id, ...createdRepair }) };

  } catch (error) {
    console.error("Error creating repair:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Kunde inte skapa reparation."}) };
  }
};
