import React, { useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import KompresFoto from './components/KompresFoto';
import KompresVideo from './components/KompresVideo';
import KompresFile from './components/KompresFile';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import Footer from './components/Footer';
import BrushIcon from '@mui/icons-material/Brush';
import WebIcon from '@mui/icons-material/Web';
import StorageIcon from '@mui/icons-material/Storage';
import './App.css';

function dataURLtoBlob(dataurl) {
  if (!dataurl || typeof dataurl !== 'string' || !dataurl.startsWith('data:')) return new Blob();
  const arr = dataurl.split(','), match = arr[0].match(/:(.*?);/);
  if (!match) return new Blob();
  const mime = match[1], bstr = atob(arr[1] || ''), n = bstr.length, u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
}

function Home() {
  const fileInputRef = useRef();
  const [resultInfo, setResultInfo] = useState([]);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  // Kompres gambar ke target 40% lebih kecil
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.src = ev.target.result;
      img.onload = () => {
        try {
          let q = 0.8, minQ = 0.1, maxQ = 1.0, best = { dataUrl: '', size: file.size, q: 1 };
          for (let i = 0; i < 10; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', q);
            const blob = dataURLtoBlob(dataUrl);
            if (blob.size <= file.size * 0.6) {
              best = { dataUrl, size: blob.size, q };
              maxQ = q;
              q = (q + minQ) / 2;
            } else {
              minQ = q;
              q = (q + maxQ) / 2;
            }
          }
          callback(best, file);
        } catch (err) {
          callback({ dataUrl: '', size: file.size, q: 1 }, file);
        }
      };
      img.onerror = () => {
        callback({ dataUrl: '', size: file.size, q: 1 }, file);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setResultInfo([]);
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    let infoArr = [];
    let processed = 0;
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        // Kompres gambar
        await new Promise(resolve => {
          compressImage(file, (best, origFile) => {
            let blob;
            let status = 'sukses';
            if (best.dataUrl && best.size < origFile.size) {
              blob = dataURLtoBlob(best.dataUrl);
              zip.file(origFile.name.replace(/\.[^/.]+$/, '') + '-kompres.jpg', blob);
            } else {
              // Jika gagal kompres, masukkan file asli
              blob = origFile;
              zip.file(origFile.name, origFile);
              status = 'gagal';
            }
            infoArr.push({
              name: origFile.name,
              asli: origFile.size,
              kompres: blob.size || blob.length || 0,
              persen: Math.round(((blob.size || blob.length || 0) / origFile.size) * 100),
              type: 'image',
              status
            });
            processed++;
            resolve();
          });
        });
      } else {
        // File lain, langsung masukkan ke zip
        zip.file(file.name, file);
        infoArr.push({
          name: file.name,
          asli: file.size,
          kompres: file.size,
          persen: 100,
          type: 'other',
          status: 'sukses'
        });
        processed++;
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    // Download hasil ZIP
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hasil-kompres.zip';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    setResultInfo(infoArr);
    e.target.value = '';
  };

  return (
    <div className="main-content">
      <h1 className="main-title">Selamat Datang di EzCompres</h1>
      <p className="main-subtitle">Kompres file Anda secara lokal, cepat, dan aman!</p>
      <div className="info-section">
        <div className="info-card">
          <ImageIcon style={{ fontSize: 40, color: '#1976d2' }} />
          <h3>Foto</h3>
          <p>Format: JPG, PNG, WEBP</p>
        </div>
        <div className="info-card">
          <VideoLibraryIcon style={{ fontSize: 40, color: '#1976d2' }} />
          <h3>Video</h3>
          <p>Format: MP4, WEBM</p>
        </div>
        <div className="info-card">
          <DescriptionIcon style={{ fontSize: 40, color: '#1976d2' }} />
          <h3>File</h3>
          <p>Format: PDF, ZIP, DOCX, PPTX, dan lainnya</p>
        </div>
      </div>
      <div className="upload-section" style={{ marginTop: 32 }}>
        <button className="upload-btn" onClick={handleButtonClick}>Pilih file untuk mulai kompres</button>
        <input type="file" multiple style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
        <p className="drag-drop-text">atau jatuhkan file di sini</p>
      </div>
      {resultInfo.length > 0 && (
        <div style={{ margin: '32px auto', maxWidth: 500, background: '#e3f2fd', borderRadius: 12, padding: 18, boxShadow: '0 2px 8px #1976d233' }}>
          <b>Hasil Kompresi:</b>
          <ul style={{ textAlign: 'left', marginTop: 12 }}>
            {resultInfo.map((f, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <span style={{ color: '#1976d2', fontWeight: 600 }}>{f.name}</span> &rarr; <span style={{ color: '#357ae8' }}>{(f.kompres/1024).toFixed(1)} KB</span> ({f.persen}% dari asli)
                {f.type === 'other' && <span style={{ color: '#b71c1c', marginLeft: 8 }}>(file non-gambar, hanya di-zip)</span>}
                {f.type === 'image' && f.status === 'gagal' && <span style={{ color: '#b71c1c', marginLeft: 8 }}>(gagal kompres, file asli dimasukkan)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="explain-section">
        <InfoOutlinedIcon style={{ color: '#1976d2', marginRight: 8 }} />
        <span>Semua proses kompresi dilakukan secara lokal di perangkat Anda, tanpa upload ke server.</span>
      </div>
      <div className="about-section">
        <div className="about-avatar">
          <PersonIcon style={{ fontSize: 48, color: '#1976d2' }} />
        </div>
        <div className="about-text">
          <b className="about-title">Tentang Pembuat:</b><br />
          <span className="about-names">Najwa dan Alys</span><br />
          <span className="about-desc">Mahasiswa Unisnu Jepara<br />Prodi Teknik Informatika Semester 4</span>
          <div className="about-bio">Kami adalah mahasiswa yang antusias di bidang teknologi dan pengembangan web, berkomitmen membuat aplikasi bermanfaat untuk semua.</div>
          <div className="about-skills">
            <div className="skill-badge"><BrushIcon style={{verticalAlign:'middle', color:'#1976d2'}}/> Design Dasar</div>
            <div className="skill-badge"><WebIcon style={{verticalAlign:'middle', color:'#1976d2'}}/> Web Developer</div>
            <div className="skill-badge"><StorageIcon style={{verticalAlign:'middle', color:'#1976d2'}}/> Database</div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kompres-foto" element={<KompresFoto />} />
        <Route path="/kompres-video" element={<KompresVideo />} />
        <Route path="/kompres-file" element={<KompresFile />} />
      </Routes>
    </Router>
  );
}

export default App;
