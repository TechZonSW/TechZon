// netlify/functions/sendSms.js

const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');

// Initieringsblock
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

// Skapa Twilio-klienten
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.handler = async (event) => {
    // Säkerhetskontroller
    if (event.httpMethod !== 'POST') return { statusCode: 405 };
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401, body: 'Åtkomst nekad' };
    const token = authHeader.split(' ')[1];
    try { jwt.verify(token, process.env.JWT_SECRET); }
    catch (error) { return { statusCode: 403, body: 'Ogiltig token' };}

    try {
        const { repairId, message } = JSON.parse(event.body);
        if (!repairId || !message) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Ärende-ID och meddelande krävs.' }) };
        }

        // Hämta kundens telefonnummer från ärendet i Firebase
        const repairDoc = await db.collection('Reparationer').doc(repairId).get();
        if (!repairDoc.exists) {
            return { statusCode: 404, body: JSON.stringify({ message: 'Ärende hittades ej.' }) };
        }
        const customerPhone = repairDoc.data().customer_phone;

        if (!customerPhone) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Kunden saknar telefonnummer i ärendet.' }) };
        }

        // Skicka SMS med Twilio
        await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: customerPhone
        });
        
        return { statusCode: 200, body: JSON.stringify({ message: 'SMS skickat!' }) };

    } catch (error) {
        // Logga det detaljerade felet från Twilio i Netlify-loggen
        console.error("Twilio SMS Error:", error);
        // Skicka ett mer generellt felmeddelande tillbaka till användaren
        return { statusCode: 500, body: JSON.stringify({ message: 'Kunde inte skicka SMS. Kontrollera telefonnummer och Twilio-inställningar.' }) };
    }
};
