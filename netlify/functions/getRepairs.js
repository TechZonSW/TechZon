// netlify/functions/getRepairs.js
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

if (!admin.apps.length) { /* ... (klistra in hela ditt vanliga initieringsblock här) ... */ }
const db = admin.firestore();

exports.handler = async (event) => {
    // JWT-säkerhetskontroll (kopiera från createRepair.js)
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401, body: 'Åtkomst nekad' };
    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return { statusCode: 403, body: 'Ogiltig token' };
    }

    try {
        const snapshot = await db.collection('Reparationer').orderBy('created_at', 'desc').get();
        const repairs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { statusCode: 200, body: JSON.stringify(repairs) };
    } catch (error) {
        return { statusCode: 500, body: 'Kunde inte hämta ärenden' };
    }
};
