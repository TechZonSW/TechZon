// netlify/functions/getRepairs.js

const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// ... (ditt kompletta initieringsblock ska vara här) ...
if (!admin.apps.length) { /* ... */ }
const db = admin.firestore();

exports.handler = async (event) => {
    // JWT-säkerhetskontroll...
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401, body: 'Åtkomst nekad' };
    const token = authHeader.split(' ')[1];
    try { jwt.verify(token, process.env.JWT_SECRET); } 
    catch (error) { return { statusCode: 403, body: 'Ogiltig token' };}

    try {
        // Hämta status-parametern från URL:en, defaulta till 'active'
        const repairStatus = event.queryStringParameters.status || 'active';
        
        const repairsRef = db.collection('Reparationer');
        
        // Bygg en dynamisk sökfråga baserad på status
        const snapshot = await repairsRef
            .where('status', '==', repairStatus)
            .orderBy('created_at', 'desc')
            .get();
            
        const repairs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return { statusCode: 200, body: JSON.stringify(repairs) };
    } catch (error) {
        console.error("Firestore query failed:", error); 
        // Om du får ett index-fel, kommer det att loggas här.
        return { statusCode: 500, body: JSON.stringify({ message: 'Kunde inte hämta ärenden från databasen.' }) };
    }
};
