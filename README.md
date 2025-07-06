# Skin Scan App - Panduan Deployment (Versi Terbaru)

Panduan ini menjelaskan langkah-langkah deployment aplikasi Skin Scan versi terbaru, di mana validasi wajah sepenuhnya dilakukan di frontend (React), dan backend hanya fokus pada prediksi kulit.

## Struktur Aplikasi

Aplikasi Skin Scan terdiri dari tiga komponen utama:
1. **Backend API** - Node.js server (Hapi) untuk prediksi kulit dan penyimpanan data
2. **Frontend** - React.js (Vite) untuk antarmuka pengguna dan validasi wajah (menggunakan TensorFlow.js)
3. **Model Machine Learning** - Model TensorFlow.js untuk prediksi jenis kulit

## Perubahan Penting Versi Ini

- **Validasi wajah hanya di frontend**: Backend tidak lagi melakukan validasi wajah, sehingga dependensi face detection hanya perlu diinstal di frontend.
- **Frontend**: Validasi wajah menggunakan @tensorflow/tfjs dan @tensorflow-models/face-detection, pastikan kedua package ini hanya di-install di `deployment/frontend`.
- **Backend**: Tidak ada dependensi atau logika validasi wajah, hanya menerima gambar dan melakukan prediksi.

## Fitur Keamanan dan Validasi

- **Validasi Wajah (Frontend)** - Sistem otomatis memvalidasi bahwa gambar yang diupload mengandung wajah sebelum dikirim ke backend
- **Validasi Dimensi (Frontend)** - Memastikan gambar memiliki resolusi yang cukup untuk analisis akurat
- **Deteksi Warna Kulit (Opsional)** - Analisis warna untuk memastikan foto adalah foto wajah manusia
- **Konfigurable** - Backend tetap dapat dikonfigurasi melalui environment variables

## Prasyarat

- Node.js v18.20.8 (direkomendasikan)
- NPM v10.8.2 (direkomendasikan)
- Git
- Ruang penyimpanan minimal 1GB (untuk model dan dependencies)
- Sistem operasi: Linux (direkomendasikan untuk produksi)

## Langkah 1: Clone Repository

```bash
# Buat direktori untuk aplikasi
mkdir -p /var/www/skinscan
cd /var/www/skinscan

# Clone repository
git clone https://github.com/Rizukaf-id/deploy-skripsi.git .
```

## Langkah 2: Setup Backend API

```bash
# Masuk ke direktori API
cd deployment/API

# Install dependencies
npm install

# Buat direktori untuk menyimpan gambar yang diupload jika belum ada
mkdir -p uploads/acne
mkdir -p uploads/combination
mkdir -p uploads/dry
mkdir -p uploads/normal
mkdir -p uploads/oily

# Salin file contoh .env
cp .env.example .env

# Edit file .env sesuai kebutuhan
nano .env
```

## Langkah 3: Setup Frontend

```bash
# Masuk ke direktori frontend
cd ../frontend

# Install dependencies
npm install

# Pastikan @tensorflow/tfjs dan @tensorflow-models/face-detection terinstall di sini

# Buat file konfigurasi .env
cp .env.example .env

# Edit file .env sesuai kebutuhan
nano .env

# Build aplikasi untuk production
npm run build
```

## Langkah 4: Deployment Production

### Backend (PM2)

```bash
# Install PM2 secara global
npm install -g pm2

# Start Backend API (dari direktori API)
cd /var/www/skinscan/deployment/API
pm2 start src/server/server.js --name "skinscan-api"
```

### Frontend (PM2 Static Serve)

```bash
# Jika menggunakan server statis untuk frontend
cd /var/www/skinscan/deployment/frontend/dist
pm2 serve . 5173 --name "skinscan-frontend" --spa
```

## Langkah 5: Setup Nginx sebagai Reverse Proxy

Install Nginx:

```bash
sudo apt update
sudo apt install nginx
```

Buat konfigurasi Nginx:

```bash
sudo nano /etc/nginx/sites-available/skinscan
```

Tambahkan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Ganti dengan domain Anda

    client_max_body_size 10M;  # Izinkan upload file hingga 10MB

    # Frontend
    location / {
        proxy_pass http://localhost:5173;  # Port frontend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        rewrite ^/api(/.*)$ $1 break;
        proxy_pass http://localhost:3000;  # Port backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;  # Waktu baca kustom untuk request yang lebih lama
    }

    # Lokasi file uploads (gambar hasil prediksi)
    location /uploads/ {
        alias /var/www/skinscan/deployment/API/uploads/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        add_header Access-Control-Allow-Origin *;
    }
}
```

Aktifkan konfigurasi dan restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/skinscan /etc/nginx/sites-enabled/
sudo nginx -t  # Test konfigurasi
sudo systemctl restart nginx
```

### (Opsional) Setup SSL dengan Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot akan secara otomatis mengupdate konfigurasi Nginx Anda untuk menggunakan HTTPS.

## Troubleshooting

- Jika validasi wajah tidak berjalan, pastikan dependensi TensorFlow.js dan face-detection sudah terinstall di frontend.
- Jika backend error terkait validasi wajah, pastikan sudah menghapus seluruh logika validasi wajah di backend.
- Untuk error lain, cek log PM2 dan console browser.

## Catatan

- Semua validasi wajah kini dilakukan di frontend, backend hanya menerima gambar yang sudah tervalidasi.
- Tidak perlu menginstall @tensorflow/tfjs atau @tensorflow-models/face-detection di backend.
- Dokumentasi dan langkah update lainnya tetap sama seperti sebelumnya.

---

Untuk detail lebih lanjut, ikuti langkah-langkah pada README ini dan sesuaikan dengan kebutuhan deployment Anda.
