# Face Detection + Skin Analysis API - Deployment Guide

## 📋 Daftar Isi
1. [Requirements](#requirements)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Server](#running-the-server)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [API Documentation](#api-documentation)
8. [System Architecture](#system-architecture)

## 🛠️ Requirements

### Sistem Operasi
- Linux (Ubuntu/Debian)
- Windows 10/11 
- macOS 10.15+

### Software
- Node.js 16.x atau lebih baru
- npm 7.x atau lebih baru
- Python 3.8+ (untuk TensorFlow)
- Git

### Hardware
- RAM: Minimal 4GB, disarankan 8GB+
- Storage: 2GB free space untuk models dan dependencies
- CPU: Dual-core atau lebih untuk performa optimal

## 🚀 Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd "app skripsi/deployment/API"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
```bash
cp .env.example .env
```

### 4. Create Required Directories
```bash
mkdir -p uploads/{acne,combination,dry,normal,oily}
mkdir -p test-images
```

### 5. Verify Model Files
Pastikan model TensorFlow.js tersedia di:
```
../../tfjs_models/
├── mobilenet_80/
│   ├── model.json
│   └── group1-shard1of1.bin
└── ...
```

## ⚙️ Configuration

### Environment Variables (.env)
```env
# Server Configuration
PORT=3000
HOST=0.0.0.0

# Model Configuration
MODEL_PATH=../../tfjs_models

# Face Detection Settings
ENABLE_FACE_VALIDATION=true
FACE_CONFIDENCE_THRESHOLD=0.5

# File Upload Settings
UPLOAD_PATH=uploads
MAX_FILE_SIZE=10485760

# Image Quality Thresholds
MIN_IMAGE_SIZE=224
MIN_BRIGHTNESS=30
MAX_BRIGHTNESS=240
MIN_CONTRAST=5

# Logging
LOG_LEVEL=info
```

### Konfigurasi Model
Edit path model di `src/services/loadModel.js` jika diperlukan.

## 🏃 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Using Start Script
```bash
./start-server.sh
```

### Docker (Optional)
```bash
docker build -t face-detection-api .
docker run -p 3000:3000 face-detection-api
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Individual Tests
```bash
npm run test:status    # Test API status
npm run test:face      # Test face detection
npm run test:load      # Load testing
```

### Manual Testing
1. Open `test-frontend.html` in browser
2. Upload a face image
3. Click "Analisis Kulit Wajah"
4. Verify results

### Test with cURL
```bash
curl -X POST http://localhost:3000/predict \
  -F "image=@test-image.jpg" \
  -F "model_name=mobilenet_80/model.json"
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "API is not accessible"
**Penyebab:** Server tidak berjalan atau port berbeda
**Solusi:**
```bash
# Check if server is running
curl http://localhost:3000

# Check port usage
netstat -an | grep :3000

# Restart server
npm start
```

#### 2. "Model tidak ditemukan"
**Penyebab:** Path model salah atau file tidak ada
**Solusi:**
```bash
# Check model files
ls -la ../../tfjs_models/

# Verify model path in .env
cat .env | grep MODEL_PATH
```

#### 3. "Wajah tidak terdeteksi"
**Penyebab:** Gambar tidak mengandung wajah yang jelas
**Solusi:**
- Gunakan gambar dengan wajah frontal
- Pastikan pencahayaan cukup
- Hindari gambar blur atau terlalu kecil

#### 4. "Memory/Performance Issues"
**Penyebab:** Model TensorFlow memakan banyak memory
**Solusi:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

#### 5. "CORS Error"
**Penyebab:** Frontend tidak bisa mengakses API
**Solusi:**
- Update CORS_ORIGIN di `.env`
- Pastikan frontend dan API di domain yang sama

### Error Codes dan Solusi

| Error Code | Deskripsi | Solusi |
|------------|-----------|--------|
| 400 | Bad Request | Periksa parameter request |
| 422 | Unprocessable Entity | Gambar tidak valid untuk analisis |
| 500 | Internal Server Error | Periksa log server |

### Debug Mode
```bash
LOG_LEVEL=debug npm start
```

### Log Files
- Server logs: Console output
- Error logs: `logs/error.log` (jika dikonfigurasi)
- Access logs: `logs/access.log` (jika dikonfigurasi)

## 📚 API Documentation

### Endpoints

#### POST /predict
**Deskripsi:** Analisis jenis kulit dari gambar wajah

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `image`: File gambar (JPEG/PNG, max 10MB)
  - `model_name`: Nama model (e.g., "mobilenet_80/model.json")

**Response Success (201):**
```json
{
  "status": "success",
  "message": "Model berhasil memprediksi jenis kulit wajah.",
  "data": {
    "id": "uuid",
    "result": "normal",
    "explanation": "Kulit normal adalah...",
    "suggestion": ["Saran 1", "Saran 2"],
    "confidenceScore": 85.6,
    "validation": {
      "faceDetected": true,
      "faceConfidence": 92
    }
  }
}
```

**Response Error (422):**
```json
{
  "status": "fail",
  "message": "Wajah tidak terdeteksi dalam gambar."
}
```

#### GET /
**Deskripsi:** Status API

**Response:**
```json
{
  "status": "success",
  "message": "API Skin Type Detection is running",
  "endpoints": {
    "predict": "POST /predict",
    "uploads": "GET /uploads/{filename}"
  }
}
```

#### GET /uploads/{filename}
**Deskripsi:** Akses file gambar yang disimpan

## 🏗️ System Architecture

### Flow Diagram
```
User Upload → Format Validation → Size Validation → 
Face Detection → Quality Check → Skin Analysis → 
Result + Recommendations
```

### Components
1. **Face Validation Service** - MediaPipe face detection
2. **Inference Service** - TensorFlow.js skin analysis
3. **Image Processing** - Sharp for image manipulation
4. **Model Loading** - Dynamic model loading
5. **File Storage** - Organized by skin type

### Face Detection Methods
1. **Primary:** BlazeFace model (TensorFlow.js)
2. **Fallback:** Custom algorithm using:
   - Skin tone detection
   - Facial symmetry analysis
   - Feature contrast detection
   - Edge detection

### Validation Layers
1. **Format:** JPEG/PNG only
2. **Size:** 224x224 to 2048x2048 pixels
3. **Quality:** Brightness, contrast, sharpness
4. **Content:** Face detection with confidence scoring

### Performance Optimizations
- Tensor cleanup to prevent memory leaks
- Lazy model loading
- Image resizing for consistent input
- Concurrent request handling

## 🔒 Security Considerations

### File Upload Security
- File type validation
- Size limits
- Virus scanning (recommended)
- Secure file storage

### API Security
- Rate limiting (recommended)
- Input validation
- Error message sanitization
- CORS configuration

### Data Privacy
- Automatic image deletion option
- No personal data storage
- GDPR compliance ready

## 📈 Monitoring & Logging

### Health Checks
```bash
curl http://localhost:3000/health
```

### Metrics
- Request count
- Response times
- Error rates
- Memory usage

### Logging Levels
- `debug`: Detailed debugging info
- `info`: General information
- `warn`: Warning messages
- `error`: Error messages only

## 🚀 Deployment Options

### 1. Standalone Server
```bash
npm start
```

### 2. Process Manager (PM2)
```bash
npm install -g pm2
pm2 start src/server/server.js --name "face-detection-api"
```

### 3. Docker
```bash
docker-compose up -d
```

### 4. Cloud Deployment
- AWS EC2/ECS
- Google Cloud Run
- Azure Container Instances
- Heroku

## 🆘 Support

### Getting Help
1. Check this documentation
2. Review error logs
3. Test with provided examples
4. Contact development team

### Common Commands
```bash
# Start server
npm start

# Run tests
npm test

# Check logs
tail -f logs/app.log

# Restart server
pkill node && npm start
```

### Useful Resources
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [MediaPipe Documentation](https://mediapipe.dev/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Hapi.js Documentation](https://hapi.dev/)
