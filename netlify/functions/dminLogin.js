// netlify/functions/adminLogin.js
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// ... (Firebase initieringskod som i förra filen) ...

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };
  
  const { username, password } = JSON.parse(event.body);
  const adminsRef = db.collection('Admins');
  const snapshot = await adminsRef.where('username', '==', username).limit(1).get();

  if (snapshot.empty) return { statusCode: 401 }; // Unauthorized

  const userDoc = snapshot.docs[0];
  const userData = userDoc.data();

  const passwordMatch = await bcrypt.compare(password, userData.password_hash);

  if (!passwordMatch) return { statusCode: 401 }; // Unauthorized

  // Skapa en JWT-token som är giltig i 8 timmar
  const token = jwt.sign({ userId: userDoc.id }, process.env.JWT_SECRET, { expiresIn: '8h' });

  return { statusCode: 200, body: JSON.stringify({ token }) };
};
