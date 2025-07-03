import React, { useState, useRef, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function SkinScanPage() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState('-');
  const [suggestion, setSuggestion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isImageTooSmall, setIsImageTooSmall] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [savedImagePath, setSavedImagePath] = useState(null);
  const [previousScans, setPreviousScans] = useState([]);
  const [isNewScan, setIsNewScan] = useState(true); // Flag untuk menandakan sedang dalam proses scan baru
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Effect for camera setup/cleanup
  useEffect(() => {
    if (showCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [showCamera]);
  
  // Effect untuk cleanup resources ketika komponen di-unmount
  useEffect(() => {
    return () => {
      // Cleanup camera
      stopCamera();
      
      // Cleanup preview URLs
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      
      // Cleanup scan history preview URLs if any
      previousScans.forEach(scan => {
        if (scan.imagePath && scan.imagePath.startsWith('blob:')) {
          URL.revokeObjectURL(scan.imagePath);
        }
      });
    };
  }, [preview, previousScans]);

  // Auto-dismiss validation error after 7 seconds
  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => {
        setValidationError(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [validationError]);
  
  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      streamRef.current = stream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Tidak dapat mengakses kamera. Pastikan browser memiliki izin akses kamera.');
      setShowCamera(false);
    }
  };
  
  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };
  
  // Helper function untuk menyimpan hasil scan yang sedang ditampilkan
  const saveCurrentScanIfExists = () => {
    if (result !== '-' && result !== '' && suggestion.length > 0) {
      const scanToSave = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        result: result,
        suggestion: [...suggestion],
        imagePath: savedImagePath || preview,
        skinType: suggestion.length > 0 ? suggestion[0].skin_type : ''
      };
      
      setPreviousScans(prev => [...prev, scanToSave]);
    }
  };

  // Take photo from camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    // Simpan hasil scan sebelumnya jika ada
    saveCurrentScanIfExists();
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw the video frame to the canvas
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Check dimensions
    const isTooSmall = canvas.width < 224 || canvas.height < 224;
    setImageDimensions({ width: canvas.width, height: canvas.height });
    setIsImageTooSmall(isTooSmall);
    
    // Convert to file
    canvas.toBlob((blob) => {
      if (blob) {
        // Jika ada preview URL sebelumnya, hapus untuk mencegah memory leak
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
        
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
        setImage(file);
        setPreview(URL.createObjectURL(blob));
        setShowCamera(false);
        
        // Reset semua state untuk scan baru
        setResult('-');
        setSuggestion([]);
        setSavedImagePath(null);
        setValidationError(null);
        setLoading(false);
        setIsNewScan(true);
      }
    }, 'image/jpeg', 0.9);
  };

  // Validasi ukuran gambar
  const validateImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const dimensions = { width: img.width, height: img.height };
        setImageDimensions(dimensions);
        
        // Check if image dimensions are at least 224x224
        const isTooSmall = img.width < 224 || img.height < 224;
        setIsImageTooSmall(isTooSmall);
        resolve(dimensions);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simpan hasil scan sebelumnya jika ada
      saveCurrentScanIfExists();
      
      // Set new image
      setImage(file);
      
      // Jika ada preview URL sebelumnya, hapus untuk mencegah memory leak
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Reset semua state untuk scan baru
      setResult('-');
      setSuggestion([]);
      setSavedImagePath(null);
      setValidationError(null);
      setLoading(false);
      setIsNewScan(true);
      
      // Matikan kamera jika sedang aktif
      if (showCamera) {
        stopCamera();
        setShowCamera(false);
      }
      
      // Validate image dimensions
      validateImageDimensions(file);
    }
  };

  // Handler untuk trigger upload dengan reset
  const handleUploadClick = () => {
    // Simpan hasil scan sebelumnya jika ada
    saveCurrentScanIfExists();
    
    // Reset file input value agar bisa upload file yang sama
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Reset state untuk upload baru
    setResult('-');
    setSuggestion([]);
    setSavedImagePath(null);
    setValidationError(null);
    setLoading(false);
    setIsNewScan(true);
    
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleScan = async () => {
    if (!image || isImageTooSmall) return;
    setLoading(true);
    
    // Reset validation error saat memulai scan baru
    setValidationError(null);
    
    const formData = new FormData();
    formData.append('image', image);
    formData.append('model_name', 'mobilenet_80/model.json');
    
    try {
      const res = await fetch('http://localhost:3000/predict', {
        method: 'POST',
        body: formData,
      });
      const response = await res.json();
      
      // Check if response has data property and then the result
      if (response && response.data && response.data.result) {
        const data = response.data;
        setResult(data.explanation);
        setSuggestion(data.suggestion || []);
        
        // Jika ada path gambar tersimpan, gunakan untuk tampilan
        if (data.imagePath) {
          setSavedImagePath(`http://localhost:3000${data.imagePath}`);
        }
        
        // Tandai bahwa ini bukan scan baru lagi
        setIsNewScan(false);
        setValidationError(null); // Clear any previous validation errors
      } else if (response && response.status === 'fail') {
        // Tampilkan pesan error spesifik dari server sebagai validation error
        setValidationError(response.message);
        setResult('-');
        setSuggestion([]);
        setSavedImagePath(null);
      } else {
        setValidationError('Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.');
        setResult('-');
        setSuggestion([]);
        setSavedImagePath(null);
      }
    } catch (err) {
      console.error('Error during prediction:', err);
      setValidationError('Gagal melakukan prediksi! Pastikan koneksi internet stabil dan coba lagi.');
      setResult('-');
      setSuggestion([]);
      setSavedImagePath(null);
    }
    setLoading(false);
    
    // Tidak perlu mereset form setelah scan, biarkan hasil tetap ditampilkan
    // Akan di-reset saat user memilih upload baru atau kamera
  };

  // Fungsi untuk reset form tanpa menghapus hasil scan sebelumnya
  const resetForm = () => {
    setImage(null);
    setPreview(null);
    setImageDimensions({ width: 0, height: 0 });
    setIsImageTooSmall(false);
    setValidationError(null); // Reset validation error
    setIsNewScan(true);
    
    // Pastikan kamera dimatikan jika sedang aktif
    if (showCamera) {
      stopCamera();
      setShowCamera(false);
    }
  };

  // Fungsi untuk membuka atau menutup kamera
  const toggleCamera = () => {
    if (showCamera) {
      // Tutup kamera jika sedang aktif
      stopCamera();
      setShowCamera(false);
    } else {
      // Simpan hasil scan sebelumnya jika ada
      saveCurrentScanIfExists();
      
      // Reset state untuk mengambil foto baru
      setImage(null);
      setPreview(null);
      setResult('-');
      setSuggestion([]);
      setSavedImagePath(null);
      setIsImageTooSmall(false);
      setValidationError(null);
      setLoading(false);
      
      // Reset file input juga
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Buka kamera
      setShowCamera(true);
      setIsNewScan(true);
    }
  };

  // Helper untuk membersihkan resource gambar
  const cleanupImageResources = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    
    if (showCamera) {
      stopCamera();
    }
  };

  return (
    <div className="bg-[#04294D] min-h-screen w-full flex flex-col">
      <nav className="w-full px-6 py-4 flex items-center">
        <img 
          src="/bromen_full_white.webp.f0bf0fdb.svg" 
          alt="Bromen Logo" 
          className="h-5 w-auto"
        />
      </nav>
      <div className="flex-1 flex items-start justify-center p-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <main className="min-h-full max-w-[1200px] w-full flex flex-col lg:flex-row gap-[20px] lg:gap-[60px] items-start justify-between py-4"
            >
              {/* Left Section */}
              <section className="flex flex-col items-center gap-[12px] w-full lg:w-[480px] lg:sticky lg:top-4">

                <div className="rounded-[16px] bg-[#CCCCCC] flex items-center justify-center overflow-hidden w-full relative" 
                  style={{ height: '450px' }}>
                  {showCamera ? (
                    <>
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <button
                          onClick={capturePhoto}
                          className="bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-4 border-[#6DAE4B]"
                        >
                          <i className="fas fa-camera text-[#6DAE4B]" style={{ fontSize: '24px' }}></i>
                        </button>
                      </div>
                    </>
                  ) : preview ? (
                    <>
                    <img 
                      src={savedImagePath || preview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={() => {
                        // Jika gambar tersimpan gagal dimuat, gunakan preview lokal
                        if (savedImagePath) setSavedImagePath(null);
                      }} 
                    />
                    {isImageTooSmall && (
                      <div className="absolute bottom-0 left-0 right-0 bg-red-500 bg-opacity-80 text-white p-2 text-center font-semibold">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Ukuran gambar terlalu kecil ({imageDimensions.width}x{imageDimensions.height}px)
                        <p className="text-sm">Minimum 224x224 piksel</p>
                      </div>
                    )}

                    {validationError && (
                      <div className="absolute bottom-0 left-0 right-0 bg-red-600 bg-opacity-90 text-white p-3 text-center font-semibold">
                        <i className="fas fa-times-circle mr-2"></i>
                        <div className="text-sm font-medium">{validationError}</div>
                      </div>
                    )}

                  </>
                  ) : (
                    <div className="text-center">
                      <i className="fas fa-camera text-gray-600 mb-2" style={{ fontSize: '64px' }}></i>
                      <p className="text-gray-600 text-lg">Silakan pilih atau ambil foto</p>
                    </div>
                  )}
                </div>

                
                <div className="flex flex-col w-full gap-3">
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="w-full">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                      <button 
                        onClick={handleUploadClick}
                        className={`
                          w-full bg-[#6DAE4B] text-white rounded-lg flex items-center justify-center gap-3
                          cursor-pointer transition-colors hover:bg-[#5c9940]
                        `} 
                        style={{ height: '56px', fontSize: '20px', fontWeight: '500' }}
                      >
                        Upload Foto
                        <i className="fas fa-upload text-white" style={{ fontSize: '24px' }}></i>
                      </button>
                    </div>
                    
                    <button 
                      onClick={toggleCamera} 
                      className={`
                        w-full rounded-lg flex items-center justify-center gap-3
                        ${showCamera ? 'bg-red-500 hover:bg-red-600' : 'bg-[#6DAE4B] hover:bg-[#5c9940]'}
                        text-white transition-colors
                      `}
                      style={{ height: '56px', fontSize: '20px', fontWeight: '500' }}
                    >
                      {showCamera ? (
                        <>
                          Tutup Kamera
                          <i className="fas fa-times text-white" style={{ fontSize: '24px' }}></i>
                        </>
                      ) : (
                        <>
                          Ambil Foto
                          <i className="fas fa-camera text-white" style={{ fontSize: '24px' }}></i>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={handleScan}
                    disabled={loading || !image || isImageTooSmall}
                    className={`
                      text-white rounded-lg flex items-center justify-center gap-3
                      ${!loading && image && !isImageTooSmall ? 'bg-[#6DAE4B] hover:bg-[#5c9940]' : 'bg-gray-400 cursor-not-allowed'}
                      transition-colors
                    `}
                    style={{ width: '100%', height: '56px', fontSize: '20px', fontWeight: '500' }}
                  >
                    {loading ? 'Processing...' : 
                     isImageTooSmall ? 'Gambar Terlalu Kecil' : 
                     'Scan Kulitmu'}
                    <i className={`fas ${isImageTooSmall ? 'fa-exclamation-triangle' : 'fa-face-smile-beam'} text-white`} style={{ fontSize: '28px' }}></i>
                  </button>

                  {/* Panduan Validasi Wajah */}
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <i className="fas fa-info-circle text-blue-400 text-xl"></i>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Panduan Foto yang Baik
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ul className="list-disc list-inside space-y-1">
                            <li>Gunakan foto wajah yang jelas dan menghadap kamera</li>
                            <li>Pastikan pencahayaan cukup terang</li>
                            <li>Ukuran gambar minimal 224x224 piksel</li>
                            <li>Hindari foto yang terlalu jauh atau tertutup</li>
                            <li>Hanya foto wajah yang akan diterima sistem (tidak termasuk foto benda, pemandangan, atau hewan)</li>
                            <li>Sistem akan memvalidasi keberadaan wajah secara otomatis</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Error Notification */}
                  {validationError && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <i className="fas fa-exclamation-circle text-red-400 text-xl"></i>
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-red-800">
                            Validasi Gagal
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            {validationError}
                          </div>
                          <div className="mt-2 text-xs text-red-600 font-medium">
                            💡 Tip: Gunakan foto wajah yang berbeda atau coba scan lagi
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <button
                            className="bg-white rounded-md text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 p-1"
                            onClick={() => setValidationError(null)}
                          >
                            <span className="sr-only">Tutup</span>
                            <i className="fas fa-times text-sm"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Right Section */}
              <section className="flex flex-col text-white w-full lg:w-[640px] h-full lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto scrollbar-hide pr-2">
                <p className="font-normal mb-[4px]" style={{ fontSize: '16px', lineHeight: '24px' }}>
                  Jenis kulitmu
                </p>
                <h2 className="font-extrabold mb-[16px]" style={{ fontSize: '40px', lineHeight: '48px' }}>
                  {!isNewScan ? (result || '-') : '-'}
                </h2>
                <p className="font-semibold mb-[16px]" style={{ fontSize: '18px', lineHeight: '24px' }}>
                  Rekomendasi Produk Buatmu
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!isNewScan && suggestion.length > 0 ? suggestion
                    .filter(item => !['moisturizer', 'sunscreen'].includes(item.id))
                    .map((item, idx) => (
                      <article
                        key={idx}
                        className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-98 transition-all duration-300 cursor-pointer mb-4"
                        style={{ height: '240px' }}
                        onClick={() => {
                          if (item.store_url) {
                            window.open(item.store_url, '_blank');
                          }
                        }}
                      >
                        <div className="relative w-full" style={{ height: '160px', aspectRatio: '1/1' }}>
                          <img
                            src={item.image ? `http://localhost:3000${item.image}` : "http://localhost:3000/assets/product/produk.webp"}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            onError={(e) => {
                              e.target.src = "http://localhost:3000/assets/product/produk.webp";
                            }}
                          />
                        </div>
                        <div className="p-3 h-[80px] flex flex-col justify-between">
                          <h3 className="text-gray-900 font-semibold text-sm leading-tight line-clamp-2" style={{ fontSize: '16px', lineHeight: '16px', height: '32px' }}>
                            {item.name}
                          </h3>
                          <div className="mt-auto flex items-center justify-between">
                            <span className="text-red-600 font-bold" style={{ fontSize: '16px' }}>
                              {item.price}
                            </span>
                          </div>
                        </div>
                      </article>
                    )) : (
                      <div className="text-gray-400 text-lg col-span-2 text-center py-8">
                        Belum ada rekomendasi
                      </div>
                    )}
                </div>
                
                {/* Essential Products Section */}
                {!isNewScan && suggestion.length > 0 && suggestion.some(item => ['moisturizer', 'sunscreen'].includes(item.id)) && (
                  <div className="mt-8">
                    <p className="font-semibold mb-4" style={{ fontSize: '18px', lineHeight: '24px' }}>
                      Produk Lain Yang Juga Bagus Buatmu
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {suggestion
                        .filter(item => ['moisturizer', 'sunscreen'].includes(item.id))
                        .map((item, idx) => (
                          <article
                            key={`essential-${idx}`}
                            className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-98 transition-all duration-300 cursor-pointer mb-4"
                            style={{ height: '240px' }}
                            onClick={() => {
                              if (item.store_url) {
                                window.open(item.store_url, '_blank');
                              }
                            }}
                          >
                            <div className="relative w-full" style={{ height: '160px', aspectRatio: '1/1' }}>
                              <img
                                src={item.image ? `http://localhost:3000${item.image}` : "http://localhost:3000/assets/product/produk.webp"}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                onError={(e) => {
                                  e.target.src = "http://localhost:3000/assets/product/produk.webp";
                                }}
                              />
                            </div>
                            <div className="p-3 h-[80px] flex flex-col justify-between">
                              <h3 className="text-gray-900 font-semibold text-sm leading-tight line-clamp-2" style={{ fontSize: '16px', lineHeight: '16px', height: '32px' }}>
                                {item.name}
                              </h3>
                              <div className="mt-auto flex items-center justify-between">
                                <span className="text-red-600 font-bold" style={{ fontSize: '16px' }}>
                                  {item.price}
                                </span>
                              </div>
                            </div>
                          </article>
                        ))}
                    </div>
                  </div>
                )}
              </section>
            </main>

            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .line-clamp-2 {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
            `}</style>
          </div>
    </div>
    
  );
}
