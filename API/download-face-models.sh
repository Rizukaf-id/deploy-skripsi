#!/bin/bash

# Script untuk mendownload model face-api.js
# Jalankan dari direktori API

echo "📦 Mendownload model face-api.js..."

# Buat direktori models jika belum ada
mkdir -p src/models

# Download model files dari CDN face-api.js
cd src/models

echo "📥 Downloading SSD MobileNetV1..."
wget -q https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json
wget -q https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1.bin

echo "📥 Downloading Face Landmark 68 Net..."
wget -q https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
wget -q https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1.bin

echo "📥 Downloading Face Recognition Net..."
wget -q https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
wget -q https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1.bin
wget -q https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2.bin

cd ../..

echo "✅ Model face-api.js berhasil didownload!"
echo "📁 Model disimpan di: src/models/"
echo ""
echo "🚀 Sekarang Anda dapat menjalankan server dengan validasi wajah aktif."
