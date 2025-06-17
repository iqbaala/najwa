import React, { useState, useRef } from 'react';

function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
}

function KompresFoto() {
  const [src, setSrc] = useState(null);
  const [output, setOutput] = useState(null);
  const [quality, setQuality] = useState(0.7);
  const [filename, setFilename] = useState('');
  const [sizeInfo, setSizeInfo] = useState({ asli: 0, kompres: 0, persen: 0 });
  const imgRef = useRef();

  // Fungsi kompres dengan kualitas tertentu dan return dataUrl & blob size
  const compressImage = (img, q) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', q);
    const blob = dataURLtoBlob(dataUrl);
    return { dataUrl, size: blob.size };
  };

  // Kompres otomatis ke target 40% lebih kecil
  const autoCompress = (img, fileSize) => {
    let q = 0.8;
    let minQ = 0.1;
    let maxQ = 1.0;
    let best = { dataUrl: '', size: fileSize, q: 1 };
    for (let i = 0; i < 10; i++) {
      const { dataUrl, size } = compressImage(img, q);
      if (size <= fileSize * 0.6) {
        best = { dataUrl, size, q };
        maxQ = q;
        q = (q + minQ) / 2;
      } else {
        minQ = q;
        q = (q + maxQ) / 2;
      }
    }
    return best;
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFilename(file.name.replace(/\.[^/.]+$/, ''));
    setOutput(null);
    setSizeInfo({ asli: file.size, kompres: 0, persen: 0 });
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSrc(ev.target.result);
      // Setelah gambar dimuat, kompres otomatis
      const img = new window.Image();
      img.src = ev.target.result;
      img.onload = () => {
        const best = autoCompress(img, file.size);
        setOutput(best.dataUrl);
        setQuality(best.q);
        setSizeInfo({
          asli: file.size,
          kompres: best.size,
          persen: Math.round((best.size / file.size) * 100)
        });
      };
    };
    reader.readAsDataURL(file);
  };

  const handleKompres = () => {
    const img = imgRef.current;
    const { dataUrl, size } = compressImage(img, quality);
    setOutput(dataUrl);
    setSizeInfo(info => ({ ...info, kompres: size, persen: Math.round((size / info.asli) * 100) }));
  };

  return (
    <div style={{ textAlign: 'center', marginTop: 40 }}>
      <h2>Kompres Foto (JPG/PNG/WEBP)</h2>
      <input type="file" accept="image/*" onChange={handleFile} style={{ margin: '20px 0' }} />
      {src && (
        <div style={{ margin: '24px 0' }}>
          <img ref={imgRef} src={src} alt="preview" style={{ maxWidth: 320, maxHeight: 220, borderRadius: 8, boxShadow: '0 2px 8px #1976d233' }} />
          <div style={{ margin: '18px 0' }}>
            <label>Kualitas: {Math.round(quality * 100)}%</label>
            <input type="range" min="0.1" max="1" step="0.01" value={quality} onChange={e => setQuality(Number(e.target.value))} style={{ width: 180, marginLeft: 12 }} />
            <button onClick={handleKompres} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', marginLeft: 18 }}>
              Kompres Manual
            </button>
          </div>
        </div>
      )}
      {output && (
        <div style={{ margin: '24px 0' }}>
          <div>Preview Hasil Kompres:</div>
          <img src={output} alt="output" style={{ maxWidth: 320, maxHeight: 220, borderRadius: 8, boxShadow: '0 2px 8px #1976d233', margin: '12px 0' }} />
          <div style={{ margin: '10px 0', color: '#1976d2', fontWeight: 'bold' }}>
            Ukuran asli: {(sizeInfo.asli/1024).toFixed(1)} KB &rarr; Hasil: {(sizeInfo.kompres/1024).toFixed(1)} KB ({sizeInfo.persen}% dari asli)
          </div>
          <a href={output} download={filename + '-kompres.jpg'} style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 18 }}>Download Hasil</a>
        </div>
      )}
    </div>
  );
}

export default KompresFoto; 