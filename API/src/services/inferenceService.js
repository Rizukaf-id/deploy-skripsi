const tf = require('@tensorflow/tfjs-node');
const InputError = require('../exceptions/InputError');
const getRecommendationBySkinType = require('./recommendationService');
require('dotenv').config();

async function predictClassification(model, image) {
  try {
    // Simpan buffer gambar asli untuk validasi dan penyimpanan
    const imageBuffer = Buffer.from(image);
    const decodedImage = tf.node.decodeJpeg(image);
    const [height, width] = decodedImage.shape;
    
    if (width < 224 || height < 224) {
      throw new InputError(`Ukuran gambar terlalu kecil. Minimal ukuran 224x224 piksel, gambar yang diunggah berukuran ${width}x${height} piksel.`);
    }
    
    const tensor = decodedImage
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(tf.scalar(127.5))
        .sub(tf.scalar(1))
        .expandDims(0); // batch axis
    
    console.log('Tensor shape:', tensor.shape);
    const prediction = model.predict(tensor);
    const score = await prediction.data();
    const confidenceScore = Math.max(...score) * 100;

    // Ubah kelas sesuai jenis kulit
    const classes = ['acne', 'combination', 'dry', 'normal', 'oily'];
    const classResult = tf.argMax(prediction, 1).dataSync()[0];
    const label = classes[classResult];

    console.log('🎯 Prediksi jenis kulit:', label, `(${Math.round(confidenceScore)}%)`);

    // Ambil rekomendasi dari file JSON
    const recommendationObj = getRecommendationBySkinType(label);
    let explanation = '', suggestion = [];
    if (recommendationObj) {
      explanation = recommendationObj.prediction;
      suggestion = recommendationObj.recommendation;
    }

    // Cleanup tensors
    decodedImage.dispose();
    tensor.dispose();
    prediction.dispose();

    // Kembalikan imageBuffer untuk disimpan berdasarkan kategori kulit
    return { 
      confidenceScore, 
      label, 
      explanation, 
      suggestion, 
      imageBuffer
    };
  } catch (error) {
    console.error('❌ Error dalam prediksi:', error.message);
    throw new InputError(`Terjadi kesalahan input: ${error.message}`);
  }
}

module.exports = predictClassification;