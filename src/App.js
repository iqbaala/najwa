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
import { motion } from 'framer-motion';

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

  // Kompres gambar ke ukuran lebih kecil dari asli (paksa kualitas rendah jika perlu)
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.src = ev.target.result;
      img.onload = () => {
        try {
          let minQ = 0.05, maxQ = 1.0, best = { dataUrl: '', size: file.size, q: 1 };
          let found = false;
          for (let i = 0; i < 15; i++) {
            let q = maxQ - (i * (maxQ - minQ) / 14); // turunkan kualitas bertahap
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', q);
            const blob = dataURLtoBlob(dataUrl);
            if (blob.size < file.size * 0.9) { // minimal 10% lebih kecil
              best = { dataUrl, size: blob.size, q };
              found = true;
              break;
            }
            if (blob.size < best.size) {
              best = { dataUrl, size: blob.size, q };
            }
          }
          // Jika tidak pernah lebih kecil, paksa kualitas paling rendah
          if (!found) {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', minQ);
            const blob = dataURLtoBlob(dataUrl);
            if (blob.size < best.size) {
              best = { dataUrl, size: blob.size, q: minQ };
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
    let infoArr = [];
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        // Kompres gambar
        await new Promise(resolve => {
          compressImage(file, (best, origFile) => {
            let blob;
            let status = 'sukses';
            let fileName = origFile.name.replace(/\.[^/.]+$/, '') + '-kompres.jpg';
            if (best.dataUrl && best.size < origFile.size) {
              blob = dataURLtoBlob(best.dataUrl);
            } else {
              // Jika gagal kompres, pakai file asli
              blob = origFile;
              fileName = origFile.name;
              status = 'gagal';
            }
            // Download file hasil kompresi
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 100);
            infoArr.push({
              name: origFile.name,
              asli: origFile.size,
              kompres: blob.size || blob.length || 0,
              persen: Math.round(((blob.size || blob.length || 0) / origFile.size) * 100),
              type: 'image',
              status
            });
            resolve();
          });
        });
      } else {
        // File lain, langsung download file aslinya
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        infoArr.push({
          name: file.name,
          asli: file.size,
          kompres: file.size,
          persen: 100,
          type: 'other',
          status: 'sukses'
        });
      }
    }
    setResultInfo(infoArr);
    e.target.value = '';
  };

  return (
    <div className="main-content">
      <motion.h1 className="main-title" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>Selamat Datang di EzCompres</motion.h1>
      <motion.p className="main-subtitle" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>Kompres file Anda secara lokal, cepat, dan aman!</motion.p>
      <motion.div className="info-section" initial="hidden" animate="visible" variants={{hidden: {}, visible: {transition: {staggerChildren: 0.15}}}}>
        <motion.div className="info-card" variants={{hidden: {opacity: 0, y: 40}, visible: {opacity: 1, y: 0}}} whileHover={{ scale: 1.06, boxShadow: '0 8px 32px #1976d244' }}>
          <ImageIcon className="icon" />
          <div className="info-card-content">
            <h3>Foto</h3>
            <p>Format: JPG, PNG, WEBP</p>
          </div>
        </motion.div>
        <motion.div className="info-card" variants={{hidden: {opacity: 0, y: 40}, visible: {opacity: 1, y: 0}}} whileHover={{ scale: 1.06, boxShadow: '0 8px 32px #1976d244' }}>
          <VideoLibraryIcon className="icon" />
          <div className="info-card-content">
            <h3>Video</h3>
            <p>Format: MP4, WEBM</p>
          </div>
        </motion.div>
        <motion.div className="info-card" variants={{hidden: {opacity: 0, y: 40}, visible: {opacity: 1, y: 0}}} whileHover={{ scale: 1.06, boxShadow: '0 8px 32px #1976d244' }}>
          <DescriptionIcon className="icon" />
          <div className="info-card-content">
            <h3>File</h3>
            <p>Format: PDF, ZIP, DOCX, PPTX</p>
          </div>
        </motion.div>
      </motion.div>
      <motion.div className="upload-section" style={{ marginTop: 32 }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.3 }}>
        <button className="upload-btn" onClick={handleButtonClick}>Pilih file untuk mulai kompres</button>
        <input type="file" multiple style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
        <p className="drag-drop-text">atau jatuhkan file di sini</p>
      </motion.div>
      {resultInfo.length > 0 && (
        <motion.div style={{ margin: '32px auto', maxWidth: 500, background: '#e3f2fd', borderRadius: 12, padding: 18, boxShadow: '0 2px 8px #1976d233' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <b>Hasil Kompresi:</b>
          <ul style={{ textAlign: 'left', marginTop: 12 }}>
            {resultInfo.map((f, i) => (
              <motion.li key={i} style={{ marginBottom: 8 }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}>
                <span style={{ color: '#1976d2', fontWeight: 600 }}>{f.name}</span> &rarr; <span style={{ color: '#357ae8' }}>{(f.kompres/1024).toFixed(1)} KB</span> ({f.persen}% dari asli)
                {f.type === 'other' && <span style={{ color: '#b71c1c', marginLeft: 8 }}>(file non-gambar, hanya di-zip)</span>}
                {f.type === 'image' && f.status === 'gagal' && <span style={{ color: '#b71c1c', marginLeft: 8 }}>(gagal kompres, file asli dimasukkan)</span>}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
      <motion.div className="explain-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}>
        <InfoOutlinedIcon style={{ color: '#1976d2', marginRight: 8 }} />
        <span>Semua proses kompresi dilakukan secara lokal di perangkat Anda, tanpa upload ke server.</span>
      </motion.div>
      <div className="about-section">
        <div className="about-avatar">
          <PersonIcon style={{ fontSize: 48, color: '#1976d2' }} />
        </div>
        <div className="about-text">
          <b className="about-title">Tentang Pembuat:</b><br />
          <span className="about-names">Najwa dan Alys</span><br />
          
          <div className="about-bio">Kami adalah mahasiswa yang antusias di bidang teknologi dan pengembangan web, berkomitmen membuat aplikasi bermanfaat untuk semua.</div>
          <div className="about-skills">
            <div className="skill-badge"><BrushIcon style={{verticalAlign:'middle', color:'#1976d2'}}/> Web Design</div>
            <div className="skill-badge"><WebIcon style={{verticalAlign:'middle', color:'#1976d2'}}/> Web Developer</div>
            <div className="skill-badge"><StorageIcon style={{verticalAlign:'middle', color:'#1976d2'}}/> Programmer</div>
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
