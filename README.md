# Skin Scan App - Panduan Deployment

Panduan ini akan menjelaskan langkah-langkah detail untuk melakukan deployment aplikasi Skin Scan mulai dari clone repository hingga menjalankan sistem secara online.

## Struktur Aplikasi

Aplikasi Skin Scan terdiri dari tiga komponen utama:
1. **Backend API** - Node.js server dengan framework Hapi yang menangani prediksi kulit dan menyimpan data
2. **Frontend** - Aplikasi React.js dengan Vite untuk antarmuka pengguna
3. **Model Machine Learning** - Model TensorFlow.js untuk prediksi jenis kulit

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
git clone <URL_REPOSITORY> .
```

## Langkah 1.1: Instalasi Node.js v18.20.8 & NPM v10.8.2 (Jika belum terinstal)

```bash
# Instalasi NVM (Node Version Manager) untuk manajemen versi Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.bashrc  # Atau source ~/.zshrc jika menggunakan zsh

# Install Node.js v18.20.8
nvm install 18.20.8
nvm use 18.20.8
nvm alias default 18.20.8

# Install NPM v10.8.2
npm install -g npm@10.8.2

# Verifikasi instalasi
node --version  # Harus menampilkan v18.20.8
npm --version   # Harus menampilkan v10.8.2
```

## Langkah 1.2: Setup Git dan .gitignore

Pastikan repository Git Anda memiliki konfigurasi `.gitignore` yang tepat untuk menghindari commit file sensitif:

```bash
# Pastikan .gitignore ada di root repositori dan folder deployment
cat > /var/www/skinscan/.gitignore << 'EOL'
# Environment variables
.env
.env.*
!.env.example

# Dependency directories
node_modules/

# Logs
logs
*.log

# Build output
dist/
build/

# Uploads
uploads/*
!uploads/.gitkeep
EOL

# Salin .gitignore ke folder deployment jika belum ada
cp /var/www/skinscan/.gitignore /var/www/skinscan/deployment/.gitignore

# Buat folder uploads dengan .gitkeep untuk mempertahankan struktur
mkdir -p /var/www/skinscan/deployment/API/uploads
touch /var/www/skinscan/deployment/API/uploads/.gitkeep
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
```

### Konfigurasi Backend

Salin file template konfigurasi dan sesuaikan dengan kebutuhan:

```bash
# Salin file contoh .env
cp .env.example .env

# Edit file .env sesuai kebutuhan
nano .env
```

Berikut adalah contoh isi file `.env` untuk backend:

```
PORT=3000
HOST=0.0.0.0
MODEL_PATH=../../../model
UPLOAD_PATH=uploads
LOG_LEVEL=info
CORS_ORIGIN=*
```

> **PENTING**: File `.env` berisi informasi sensitif dan TIDAK BOLEH dicommit ke Git repository. Pastikan file tersebut sudah tercantum dalam `.gitignore`.

Pastikan path ke model benar dan model tersedia di lokasi yang ditentukan.

## Langkah 3: Setup Frontend

```bash
# Masuk ke direktori frontend
cd ../frontend

# Install dependencies
npm install

# Buat file konfigurasi .env
echo "VITE_API_URL=http://DOMAIN_OR_IP:3000" > .env

# Build aplikasi untuk production
npm run build
```

### Konfigurasi Frontend

Salin file template konfigurasi dan sesuaikan dengan kebutuhan:

```bash
# Salin file contoh .env
cp .env.example .env

# Edit file .env sesuai kebutuhan
nano .env
```

Dalam file `.env` di direktori `deployment/frontend`, ganti `DOMAIN_OR_IP` dengan domain atau IP server Anda.

> **PENTING**: File `.env` berisi informasi sensitif dan TIDAK BOLEH dicommit ke Git repository. Pastikan file tersebut sudah tercantum dalam `.gitignore`.

## Langkah 4: Deployment dengan PM2 (Untuk Produksi)

PM2 adalah process manager untuk aplikasi Node.js yang menjaga aplikasi tetap berjalan.

```bash
# Install PM2 secara global
npm install -g pm2

# Start Backend API (dari direktori API)
cd /var/www/skinscan/deployment/API
pm2 start src/server/server.js --name "skinscan-api"

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

## Langkah 6: Setup SSL dengan Certbot (Opsional tapi Direkomendasikan)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot akan secara otomatis mengupdate konfigurasi Nginx Anda untuk menggunakan HTTPS.

## Langkah 7: Konfigurasi Firewall

```bash
# Izinkan SSH, HTTP, dan HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## Memulai Aplikasi Otomatis pada Boot

```bash
pm2 startup
# Ikuti instruksi yang muncul
pm2 save
```

## Monitoring dan Logs

```bash
# Monitor semua aplikasi
pm2 monit

# Lihat logs backend
pm2 logs skinscan-api

# Lihat logs frontend
pm2 logs skinscan-frontend

# Lihat logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Pemeliharaan

### Restart Layanan

```bash
# Restart backend
pm2 restart skinscan-api

# Restart frontend
pm2 restart skinscan-frontend

# Restart Nginx
sudo systemctl restart nginx
```

### Update Aplikasi

```bash
cd /var/www/skinscan
git pull

# Update backend
cd deployment/API
npm install
pm2 restart skinscan-api

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart skinscan-frontend
```

### Backup Data

Backup direktori uploads secara berkala:

```bash
# Backup ke direktori home
tar -czvf ~/skinscan_uploads_$(date +%Y%m%d).tar.gz /var/www/skinscan/deployment/API/uploads

# Opsional: Pindahkan ke lokasi backup eksternal
# rsync -avz ~/skinscan_uploads_*.tar.gz user@backup-server:/path/to/backups/
```

## Troubleshooting

### Backend API tidak berjalan
- Periksa log: `pm2 logs skinscan-api`
- Pastikan port 3000 tidak digunakan oleh aplikasi lain: `lsof -i :3000`
- Periksa file `.env` untuk konfigurasi yang benar: `cat /var/www/skinscan/deployment/API/.env | grep -v PASSWORD`
- Periksa apakah menggunakan Node.js versi 18.20.8: `node --version`
- Periksa apakah menggunakan NPM versi 10.8.2: `npm --version`
- Periksa apakah model dapat dimuat: `cd /var/www/skinscan/deployment/API && node -e "require('@tensorflow/tfjs-node'); console.log('TensorFlow.js berhasil dimuat')"`

### Frontend tidak menampilkan data
- Periksa console browser untuk error
- Pastikan VITE_API_URL dikonfigurasi dengan benar di file .env
- Verifikasi bahwa API dapat diakses dengan: `curl http://localhost:3000/health`
- Periksa CORS headers jika mengakses dari domain yang berbeda

### Model tidak dapat dimuat
- Pastikan path model di `.env` benar
- Periksa direktori model untuk file-file yang diperlukan (model.json dan shard files)
- Jika menggunakan @tensorflow/tfjs-node, pastikan sudah diinstal dan kompatibel dengan Node.js v18.20.8
- Jika ada error pada TensorFlow, coba rebuild dengan: `cd /var/www/skinscan/deployment/API && npm rebuild @tensorflow/tfjs-node --build-from-source`

### 404 pada uploads
- Pastikan direktori uploads dibuat dan dapat diakses
- Periksa permission direktori: `chmod -R 755 /var/www/skinscan/deployment/API/uploads`
- Pastikan konfigurasi Nginx untuk lokasi /uploads/ sudah benar

### Masalah Performa
- Jika prediksi lambat, pertimbangkan untuk meningkatkan resource server
- Untuk aplikasi dengan traffic tinggi, pertimbangkan menggunakan load balancer
- Aktifkan Nginx caching untuk file statis

## Keamanan

### Environment Variables & Credentials

Langkah-langkah untuk mengelola environment variables dengan aman:

1. **Jangan pernah menyimpan credentials di repository Git**
   - Gunakan file `.env` yang sudah ditambahkan ke `.gitignore`
   - Selalu salin dari `.env.example` dan isi dengan nilai yang sesuai

2. **Batasi akses ke file environment**
   ```bash
   # Ubah permission file .env agar hanya dapat diakses oleh owner
   chmod 600 /var/www/skinscan/deployment/API/.env
   chmod 600 /var/www/skinscan/deployment/frontend/.env
   ```

3. **Gunakan secrets management untuk production**
   - Pertimbangkan menggunakan Vault, AWS Secrets Manager, atau Docker Secrets untuk deployment skala besar
   - Rotasi credentials secara berkala

4. **Backup file environment dengan aman**
   ```bash
   # Enkripsi file .env sebelum backup
   gpg -c --cipher-algo AES256 /var/www/skinscan/deployment/API/.env
   ```

### Hardening Server
```bash
# Update sistem secara reguler
sudo apt update && sudo apt upgrade

# Konfigurasikan fail2ban untuk mencegah brute force
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Rate limiting di Nginx
# Tambahkan ke dalam blok http di /etc/nginx/nginx.conf:
# limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
# Dan tambahkan ke lokasi API:
# limit_req zone=api burst=10 nodelay;
```

### Security Headers
Tambahkan ke konfigurasi Nginx untuk meningkatkan keamanan:

```nginx
# Tambahkan di dalam blok server
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```


## Catatan Tambahan

- Pastikan server memiliki setidaknya 2GB RAM dan 2 CPU cores untuk performa yang baik
- Gunakan CDN untuk menyajikan konten statis jika mengantisipasi traffic yang tinggi
- Pertimbangkan untuk menggunakan layanan monitoring seperti UptimeRobot atau Grafana untuk memantau ketersediaan aplikasi
