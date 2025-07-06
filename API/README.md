# API Skin Type Detection dengan Face Validation

API ini menggunakan MediaPipe Face Detection untuk memvalidasi apakah gambar yang diunggah mengandung wajah manusia sebelum melakukan analisis jenis kulit.

## Fitur Utama

1. **Face Detection**: Menggunakan MediaPipe untuk mendeteksi wajah dalam gambar
2. **Image Validation**: Memvalidasi format, ukuran, dan kualitas gambar
3. **Skin Type Analysis**: Menganalisis jenis kulit (acne, combination, dry, normal, oily)
4. **Quality Control**: Memastikan gambar memiliki kualitas yang cukup untuk analisis

## Instalasi

```bash
npm install
```

## Menjalankan Server

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## Endpoints

### 1. Prediksi Jenis Kulit
- **URL**: `POST /predict`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `image`: File gambar (JPEG/PNG)
  - `model_name`: Nama model (contoh: "mobilenet_80/model.json")

### 2. Akses Gambar
- **URL**: `GET /uploads/{filename}`
- **Deskripsi**: Mengakses gambar yang telah disimpan

### 3. Status API
- **URL**: `GET /`
- **Deskripsi**: Cek status API

## Alur Validasi

1. **Upload Gambar**: User mengunggah foto
2. **Validasi Format**: Cek format file (JPEG/PNG)
3. **Validasi Ukuran**: Cek dimensi minimal 224x224px
4. **Validasi Kualitas**: Cek brightness, contrast, dan sharpness
5. **Face Detection**: Deteksi wajah menggunakan MediaPipe
6. **Analisis Kulit**: Jika wajah terdeteksi, lakukan analisis jenis kulit
7. **Hasil**: Kembalikan hasil prediksi dan rekomendasi

## Contoh Response

### Sukses
```json
{
  "status": "success",
  "message": "Model berhasil memprediksi jenis kulit wajah.",
  "data": {
    "id": "uuid-generated",
    "result": "normal",
    "explanation": "Kulit normal adalah jenis kulit yang seimbang...",
    "suggestion": ["Gunakan pelembab ringan", "Bersihkan wajah 2x sehari"],
    "confidenceScore": 85.6,
    "createdAt": "2025-01-01T12:00:00.000Z",
    "imagePath": "uploads/normal/image.jpg",
    "validation": {
      "faceDetected": true,
      "faceConfidence": 92,
      "imageDetails": {
        "format": "jpeg",
        "size": "512x512",
        "channels": 3,
        "fileSize": "145KB",
        "quality": 0.85
      }
    }
  }
}
```

### Error - Wajah Tidak Terdeteksi
```json
{
  "status": "fail",
  "message": "Wajah tidak terdeteksi dalam gambar. Pastikan foto menampilkan wajah yang jelas dan terang.",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### Error - Format Tidak Valid
```json
{
  "status": "fail",
  "message": "Format gambar tidak didukung. Gunakan format JPEG atau PNG.",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## Validasi yang Dilakukan

### 1. Validasi Format
- ✅ JPEG/JPG
- ✅ PNG
- ❌ GIF, BMP, WebP (tidak didukung)

### 2. Validasi Ukuran
- Minimal: 224x224 piksel
- Maksimal: 10MB

### 3. Validasi Kualitas
- **Brightness**: Tidak terlalu gelap (<30) atau terang (>240)
- **Contrast**: Minimal contrast untuk detail yang jelas
- **Sharpness**: Tidak blur, edge detection yang baik

### 4. Validasi Wajah
- Menggunakan algoritma BlazeFace (jika tersedia)
- Fallback ke analisis warna kulit dan fitur wajah
- Confidence score minimal 50%

## Tips untuk Gambar yang Baik

1. **Pencahayaan**: Gunakan pencahayaan yang cukup dan merata
2. **Fokus**: Pastikan gambar tidak blur
3. **Posisi**: Wajah harus terlihat jelas dan frontal
4. **Resolusi**: Minimal 224x224 piksel
5. **Format**: JPEG atau PNG
6. **Ukuran**: Maksimal 10MB

## Error Codes

- **400**: Bad Request - Parameter tidak valid
- **422**: Unprocessable Entity - Gambar tidak valid untuk analisis
- **500**: Internal Server Error - Kesalahan server

## Teknologi yang Digunakan

- **Framework**: Hapi.js
- **AI/ML**: TensorFlow.js, BlazeFace
- **Image Processing**: Sharp
- **Face Detection**: MediaPipe (fallback algorithm)
- **Database**: File-based storage

## Struktur Project

```
src/
├── server/
│   ├── server.js       # Main server file
│   ├── routes.js       # API routes
│   └── handler.js      # Request handlers
├── services/
│   ├── faceValidationService.js      # Face validation logic
│   ├── mediapipeFaceDetection.js     # MediaPipe implementation
│   ├── inferenceService.js          # ML prediction service
│   ├── loadModel.js                 # Model loading
│   └── saveImageService.js          # Image saving
└── exceptions/
    └── InputError.js    # Custom error handling
```
