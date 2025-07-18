// netlify/functions/sendSms.js
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');

/ --- START PÅ KORREKT INITIERINGSBLOCK ---
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

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.handler = async (event) => {
    // JWT-säkerhetskontroll ...
    
    const { repairId, message } = JSON.parse(event.body);
    if (!repairId || !message) return { statusCode: 400, body: 'Data saknas' };

    try {
        // Hämta kundens telefonnummer från ärendet
        const repairDoc = await db.collection('Reparationer').doc(repairId).get();
        if (!repairDoc.exists) return { statusCode: 404, body: 'Ärende hittades ej' };
        const customerPhone = repairDoc.data().customer_phone;

        // Skicka SMS med Twilio
        await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: customerPhone // Se till att numret har landskod, t.ex. +46...
        });
        
        return { statusCode: 200, body: 'SMS skickat!' };
    } catch (error) {
        console.error("SMS Error:", error);
        return { statusCode: 500, body: 'Kunde inte skicka SMS' };
    }
};
