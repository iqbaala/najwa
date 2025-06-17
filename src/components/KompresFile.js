import React, { useState } from 'react';
import JSZip from 'jszip';

function KompresFile() {
  const [files, setFiles] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [zipBlob, setZipBlob] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setZipBlob(null);
    setError('');
  };

  const handleCompress = async () => {
    if (files.length === 0) {
      setError('Pilih file terlebih dahulu!');
      return;
    }
    setIsCompressing(true);
    setError('');
    try {
      const zip = new JSZip();
      files.forEach(file => {
        zip.file(file.name, file);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      setZipBlob(blob);
    } catch (e) {
      setError('Terjadi kesalahan saat kompres file.');
    }
    setIsCompressing(false);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: 40 }}>
      <h2>Kompres File (ZIP)</h2>
      <input type="file" multiple onChange={handleFileChange} style={{ margin: '20px 0' }} />
      <br />
      <button onClick={handleCompress} disabled={files.length === 0 || isCompressing} style={{
        background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', marginBottom: 16
      }}>
        {isCompressing ? 'Mengompres...' : 'Kompres ke ZIP'}
      </button>
      <br />
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {zipBlob && (
        <a
          href={URL.createObjectURL(zipBlob)}
          download="hasil-kompres.zip"
          style={{ display: 'inline-block', marginTop: 16, color: '#1976d2', fontWeight: 'bold', fontSize: 18 }}
        >
          Download ZIP
        </a>
      )}
    </div>
  );
}

export default KompresFile; 