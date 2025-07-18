// netlify/functions/updateRepairStatus.js
// ... (Firebase init, etc.) ...

exports.handler = async (event) => {
    // ... (JWT-verifiering) ...
    const { repairId, newStatus } = JSON.parse(event.body);
    
    const repairRef = db.collection('Reparationer').doc(repairId);
    
    await repairRef.update({
        status_history: admin.firestore.FieldValue.arrayUnion({
            status: newStatus,
            timestamp: new Date()
        })
    });

    return { statusCode: 200, body: JSON.stringify({ message: 'Status uppdaterad!' }) };
};
