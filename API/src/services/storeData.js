const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function storeData(id, data){
    // Simpan data ke file lokal (misal: predictions.json di folder data lokal)
    const predictionsPath = path.join(__dirname, '../predictions.json');
    let predictions = [];
    if (fs.existsSync(predictionsPath)) {
        try {
            const fileContent = fs.readFileSync(predictionsPath, 'utf-8');
            if (fileContent.trim().length > 0) {
                predictions = JSON.parse(fileContent);
            }
        } catch (err) {
            // Jika file kosong atau JSON tidak valid, mulai dari array kosong
            predictions = [];
        }
    }
    predictions.push({ id, ...data });
    fs.writeFileSync(predictionsPath, JSON.stringify(predictions, null, 2));
    return true;
}

module.exports = storeData;