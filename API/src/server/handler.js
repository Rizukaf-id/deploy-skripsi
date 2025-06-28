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
    model = await loadModel(model_name);
  } catch (err) {
    console.error(err);
    return h.response({ status: 'fail', message: 'Model tidak ditemukan atau gagal di-load.' }).code(400);
  }

  const { confidenceScore, label, explanation, suggestion, imageBuffer } = await predictClassification(model, image);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  
  // Simpan gambar berdasarkan kategori kulit yang terdeteksi
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

  const response = h.response({
    status: 'success',
    message: 'Model is predicted successfully.',
    data
  })
  response.code(201);
  return response;
}

module.exports = postPredictHandler;