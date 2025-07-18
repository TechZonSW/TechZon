// netlify/functions/adminLogin.js

const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
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
  // LOGG 1: Kontrollera att funktionen körs och vilken metod som används
  console.log(`adminLogin function started with method: ${event.httpMethod}`);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    // LOGG 2: Se exakt vad som finns i event.body INNAN vi gör något med det
    console.log('Received raw body:', event.body);

    const { username, password } = JSON.parse(event.body);

    // LOGG 3: Se vad variablerna innehåller EFTER att vi parsat JSON
    console.log('Parsed username:', username);
    console.log('Parsed password:', password); // Obs: Detta är bara för felsökning, ta bort sen.

    const adminsRef = db.collection('Admins');
    const snapshot = await adminsRef.where('username', '==', username).limit(1).get();

    if (snapshot.empty) {
      // LOGG 4: Om vi inte hittar användaren
      console.log(`User '${username}' not found in database.`);
      return { statusCode: 401, body: JSON.stringify({ message: 'Fel användarnamn eller lösenord.' }) };
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // LOGG 5: Jämför lösenorden
    console.log('Comparing received password with stored hash...');
    const passwordMatch = await bcrypt.compare(password, userData.password_hash);

    if (!passwordMatch) {
      // LOGG 6: Om lösenorden inte matchar
      console.log('Password comparison failed. No match.');
      return { statusCode: 401, body: JSON.stringify({ message: 'Fel användarnamn eller lösenord.' }) };
    }

    // Om vi kommer hit, är allt korrekt!
    console.log('Login successful! Generating JWT.');
    const token = jwt.sign({ userId: userDoc.id }, process.env.JWT_SECRET, { expiresIn: '8h' });

    return { statusCode: 200, body: JSON.stringify({ token }) };

  } catch (error) {
    // LOGG 7: Om något kraschar
    console.error('CRITICAL ERROR in adminLogin:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Serverfel.' }) };
  }
};
