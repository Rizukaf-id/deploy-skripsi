const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

/**
 * Menyimpan gambar berdasarkan kategori kulit yang terdeteksi
 * @param {Buffer} imageBuffer - Buffer gambar yang akan disimpan
 * @param {string} skinType - Jenis kulit yang terdeteksi (acne, combination, dry, normal, oily)
 * @returns {string} URL gambar relatif
 */
async function saveImageBySkinType(imageBuffer, skinType) {
  try {
    // Validasi tipe kulit
    const validSkinTypes = ['acne', 'combination', 'dry', 'normal', 'oily'];
    if (!validSkinTypes.includes(skinType)) {
      throw new Error(`Tipe kulit tidak valid: ${skinType}`);
    }

    // Get upload path from environment or use default
    const uploadPath = process.env.UPLOAD_PATH || 'uploads';
    
    // Buat direktori kategori jika belum ada
    const categoryDir = path.join(__dirname, `../../${uploadPath}`, skinType);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    // Buat nama file unik
    const timestamp = new Date().getTime();
    const randomString = crypto.randomBytes(8).toString('hex');
    const fileName = `${skinType}_${timestamp}_${randomString}.jpg`;
    const filePath = path.join(categoryDir, fileName);

    // Simpan gambar
    fs.writeFileSync(filePath, imageBuffer);

    // Kembalikan jalur relatif untuk diakses melalui URL
    return `/uploads/${skinType}/${fileName}`;
  } catch (error) {
    console.error('Error saat menyimpan gambar:', error);
    return null;
  }
}

module.exports = saveImageBySkinType;
