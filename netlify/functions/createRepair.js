// netlify/functions/createRepair.js

const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');

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
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Hjälpfunktion för att generera en slumpmässig kod
const generateRepairCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '0123456789';
  let result = '';
  
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 3; i++) {
    result += nums.charAt(Math.floor(Math.random() * nums.length));
  } 
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

  const newRepairCode = generateRepairCode(); 

  const newRepairData = {
        device_name: deviceName,
        customer_name: customerName,
        customer_phone: customerPhone,
        repair_code: newRepairCode,
        created_at: new Date(),
        status: 'active',
        status_history: [{ status: 'Ärende registrerat', timestamp: new Date() }]
    };
  
    try {
      const docRef = await db.collection('Reparationer').add(newRepairData);
      
      // --- START PÅ NY SMS-LOGIK ---
  
      if (customerPhone) { // Skicka bara om ett telefonnummer finns
          const welcomeMessage = `Hej ${customerName}! Vi har nu tagit emot din ${deviceName}. Spåra reparationen med kod ${newRepairCode}: https://techzon.netlify.app/spara. Mvh, Techzon';
  
          try {
              await twilioClient.messages.create({
                  body: welcomeMessage,
                  from: process.env.TWILIO_PHONE_NUMBER,
                  to: customerPhone
              });
              console.log(`Välkomst-SMS skickat till ${customerPhone}`);
          } catch (smsError) {
              // Logga felet men krascha inte hela funktionen.
              // Det är viktigare att ärendet skapas än att SMS:et skickas.
              console.error(`Kunde inte skicka välkomst-SMS till ${customerPhone}. Twilio-fel:`, smsError.message);
          }
      }
      // --- SLUT PÅ NY SMS-LOGIK ---
  
      const newDoc = await docRef.get();
      const createdRepair = newDoc.data();
      
      return { statusCode: 200, body: JSON.stringify({ id: newDoc.id, ...createdRepair }) };
  
    } catch (error) {
      console.error("Error creating repair:", error);
      return { statusCode: 500, body: JSON.stringify({ message: "Kunde inte skapa reparation."}) };
    }
};
