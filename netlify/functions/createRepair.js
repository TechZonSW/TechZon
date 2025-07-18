// netlify/functions/createRepair.js
// ... (Firebase init, jwt, etc.) ...

// En hjälpfunktion för att generera en slumpmässig kod
const generateRepairCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'KAL-';
  for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

exports.handler = async (event) => {
    // ... (Lägg till JWT-verifiering här senare för säkerhet) ...
    const { deviceName, customerName, customerPhone } = JSON.parse(event.body);

    const newRepair = {
        device_name: deviceName,
        customer_name: customerName,
        customer_phone: customerPhone,
        repair_code: generateRepairCode(),
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        status_history: [{
            status: 'Ärende registrerat',
            timestamp: new Date()
        }]
    };

    const docRef = await db.collection('Reparationer').add(newRepair);
    
    // Hämta den nyskapade reparationen för att returnera den fullständiga datan
    const newDoc = await docRef.get();
    
    return { statusCode: 200, body: JSON.stringify(newDoc.data()) };
};
