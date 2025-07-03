const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');
const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const InputError = require('../exceptions/InputError');

// Setup canvas untuk face-api.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

class FaceValidationService {
  constructor() {
    this.isInitialized = false;
    this.modelsLoaded = false;
  }

  /**
   * Inisialisasi model face-api.js
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Path ke model face-api.js (akan di-download otomatis)
      const MODEL_URL = path.join(__dirname, '../../../models/face-api-js');
      
      // Load model untuk deteksi wajah
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
      
      this.modelsLoaded = true;
      this.isInitialized = true;
      console.log('Face detection models loaded successfully');
    } catch (error) {
      console.warn('Could not load face-api models, using alternative detection method');
      this.isInitialized = true;
      this.modelsLoaded = false;
    }
  }

  /**
   * Deteksi wajah menggunakan face-api.js
   * @param {Buffer} imageBuffer - Buffer gambar
   * @returns {Promise<boolean>} - True jika wajah terdeteksi
   */
  async detectFaceWithFaceAPI(imageBuffer) {
    try {
      if (!this.modelsLoaded) return false;

      // Konversi buffer ke tensor
      const decodedImage = tf.node.decodeJpeg(imageBuffer);
      const canvas = new Canvas(decodedImage.shape[1], decodedImage.shape[0]);
      const ctx = canvas.getContext('2d');
      
      // Konversi tensor ke ImageData
      const imageData = await tf.browser.toPixels(decodedImage);
      const imgData = new ImageData(new Uint8ClampedArray(imageData), decodedImage.shape[1], decodedImage.shape[0]);
      ctx.putImageData(imgData, 0, 0);

      // Deteksi wajah
      const detections = await faceapi.detectAllFaces(canvas);
      
      // Cleanup
      decodedImage.dispose();
      
      return detections.length > 0;
    } catch (error) {
      console.error('Error in face-api detection:', error);
      return false;
    }
  }

  /**
   * Deteksi wajah menggunakan pendekatan sederhana berbasis warna kulit
   * @param {Buffer} imageBuffer - Buffer gambar
   * @returns {Promise<boolean>} - True jika kemungkinan mengandung wajah
   */
  async detectFaceWithColorAnalysis(imageBuffer) {
    try {
      const decodedImage = tf.node.decodeJpeg(imageBuffer);
      const [height, width, channels] = decodedImage.shape;
      
      if (channels !== 3) {
        decodedImage.dispose();
        return false;
      }

      // Konversi ke array untuk analisis
      const imageArray = await decodedImage.data();
      
      let skinPixelCount = 0;
      let totalPixels = height * width;
      
      // Rentang HSV untuk warna kulit (dikonversi ke RGB approx)
      for (let i = 0; i < imageArray.length; i += 3) {
        const r = imageArray[i];
        const g = imageArray[i + 1];
        const b = imageArray[i + 2];
        
        // Deteksi warna kulit sederhana (berbagai rentang warna kulit)
        if (this.isSkinColor(r, g, b)) {
          skinPixelCount++;
        }
      }
      
      const skinPercentage = skinPixelCount / totalPixels;
      
      // Cleanup
      decodedImage.dispose();
      
      // Jika lebih dari 10% pixel adalah warna kulit, kemungkinan ada wajah
      return skinPercentage > 0.1;
    } catch (error) {
      console.error('Error in color analysis:', error);
      return false;
    }
  }

  /**
   * Cek apakah warna termasuk rentang warna kulit
   * @param {number} r - Red value
   * @param {number} g - Green value  
   * @param {number} b - Blue value
   * @returns {boolean} - True jika warna kulit
   */
  isSkinColor(r, g, b) {
    // Rentang warna kulit yang lebih inklusif untuk berbagai etnis
    return (
      // Kulit terang
      (r > 95 && g > 40 && b > 20 && 
       Math.max(r, g, b) - Math.min(r, g, b) > 15 && 
       Math.abs(r - g) > 15 && r > g && r > b) ||
      
      // Kulit sedang
      (r > 220 && g > 210 && b > 170 && 
       Math.abs(r - g) <= 15 && r > b && g > b) ||
      
      // Kulit gelap
      (r >= 45 && r <= 255 && g >= 34 && g <= 255 && b >= 20 && b <= 255 &&
       r - g >= -30 && r - g <= 60 && r - b >= -20 && r - b <= 120)
    );
  }

  /**
   * Validasi apakah gambar mengandung wajah
   * @param {Buffer} imageBuffer - Buffer gambar
   * @returns {Promise<boolean>} - True jika valid (mengandung wajah)
   */
  async validateFaceImage(imageBuffer) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Coba deteksi dengan face-api.js terlebih dahulu
      if (this.modelsLoaded) {
        const faceDetected = await this.detectFaceWithFaceAPI(imageBuffer);
        if (faceDetected) return true;
      }

      // Fallback ke analisis warna kulit
      const skinDetected = await this.detectFaceWithColorAnalysis(imageBuffer);
      return skinDetected;

    } catch (error) {
      console.error('Error in face validation:', error);
      // Jika terjadi error, biarkan gambar lolos untuk menghindari false negative
      return true;
    }
  }

  /**
   * Validasi ukuran dan aspek rasio gambar untuk foto wajah
   * @param {Buffer} imageBuffer - Buffer gambar
   * @returns {Promise<object>} - Object dengan hasil validasi
   */
  async validateImageProperties(imageBuffer) {
    try {
      const decodedImage = tf.node.decodeJpeg(imageBuffer);
      const [height, width] = decodedImage.shape;
      
      // Cleanup
      decodedImage.dispose();

      // Validasi ukuran minimum
      if (width < 224 || height < 224) {
        return {
          valid: false,
          reason: 'Ukuran gambar terlalu kecil. Minimal 224x224 piksel untuk analisis wajah yang akurat.'
        };
      }

      // Validasi aspek rasio (untuk foto wajah, rasio yang wajar adalah 0.5 - 2.0)
      const aspectRatio = width / height;
      if (aspectRatio < 0.3 || aspectRatio > 3.0) {
        return {
          valid: false,
          reason: 'Rasio aspek gambar tidak sesuai untuk foto wajah. Gunakan gambar dengan proporsi yang lebih seimbang.'
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: 'Format gambar tidak valid atau rusak.'
      };
    }
  }

  /**
   * Validasi lengkap untuk gambar wajah
   * @param {Buffer} imageBuffer - Buffer gambar
   * @returns {Promise<object>} - Hasil validasi lengkap
   */
  async validateComplete(imageBuffer) {
    // Cek apakah validasi wajah diaktifkan
    const enableValidation = process.env.ENABLE_FACE_VALIDATION !== 'false';
    
    if (!enableValidation) {
      console.log('Face validation disabled via environment variable');
      return {
        valid: true,
        message: 'Validasi wajah dinonaktifkan.'
      };
    }

    // Validasi properti gambar terlebih dahulu
    const propValidation = await this.validateImageProperties(imageBuffer);
    if (!propValidation.valid) {
      return propValidation;
    }

    // Validasi keberadaan wajah
    const faceDetected = await this.validateFaceImage(imageBuffer);
    const strictMode = process.env.FACE_VALIDATION_STRICT === 'true';
    
    if (!faceDetected && strictMode) {
      return {
        valid: false,
        reason: 'Tidak terdeteksi wajah dalam gambar. Pastikan Anda menggunakan foto wajah yang jelas dan menghadap kamera.'
      };
    } else if (!faceDetected && !strictMode) {
      console.log('Face not detected but strict mode disabled, allowing image');
      return {
        valid: true,
        message: 'Gambar diterima (mode non-strict).'
      };
    }

    return {
      valid: true,
      message: 'Gambar valid untuk analisis kulit wajah.'
    };
  }
}

// Singleton instance
const faceValidationService = new FaceValidationService();

module.exports = faceValidationService;
