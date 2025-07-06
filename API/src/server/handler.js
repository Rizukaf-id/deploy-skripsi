const loadModel = require('../services/loadModel');
const predictClassification = require('../services/inferenceService');
const crypto = require('crypto');
const storeData = require('../services/storeData');
const saveImageBySkinType = require('../services/saveImageService');
require('dotenv').config();

async function postPredictHandler(request, h) {
  const { image, model_name } = request.payload;
  // model_name: e.g. 'mobilenet_80/model.json' (relatif ke tfjs_models)
  if (!model_name) {
    return h.response({ status: 'fail', message: 'model_name harus disertakan di form-data.' }).code(400);
  }
  
  let model;
  try {
    console.log('🔄 Loading model:', model_name);
    model = await loadModel(model_name);
    console.log('✅ Model loaded successfully');
  } catch (err) {
    console.error('❌ Error loading model:', err);
    return h.response({ status: 'fail', message: 'Model tidak ditemukan atau gagal di-load.' }).code(400);
  }

  try {
    const result = await predictClassification(model, image);
    const { confidenceScore, label, explanation, suggestion, imageBuffer } = result;
    
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    // Simpan gambar berdasarkan kategori kulit yang terdeteksi
    console.log('💾 Menyimpan gambar untuk kategori:', label);
    const imagePath = await saveImageBySkinType(imageBuffer, label);

    const data = {
      "id": id,
      "result": label,
      "explanation": explanation,
      "suggestion": suggestion,
      "confidenceScore": confidenceScore,
      "createdAt": createdAt,
      "imagePath": imagePath
    }

    await storeData(id, data);
    
    console.log('✅ Prediksi berhasil:', { id, result: label, confidence: Math.round(confidenceScore) + '%' });

    const response = h.response({
      status: 'success',
      message: 'Model berhasil memprediksi jenis kulit wajah.',
      data
    })
    response.code(201);
    return response;
    
  } catch (error) {
    console.error('❌ Error dalam handler:', error);
    
    // Return error response dengan informasi yang lebih detail
    const errorResponse = h.response({
      status: 'fail',
      message: error.message || 'Terjadi kesalahan saat memproses gambar',
      timestamp: new Date().toISOString()
    });
    
    // Set appropriate status code based on error type
    if (error.message.includes('wajah') || error.message.includes('face')) {
      errorResponse.code(422); // Unprocessable Entity
    } else if (error.message.includes('ukuran') || error.message.includes('format')) {
      errorResponse.code(400); // Bad Request
    } else {
      errorResponse.code(500); // Internal Server Error
    }
    
    return errorResponse;
  }
}

module.exports = postPredictHandler;