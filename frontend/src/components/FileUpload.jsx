import React, { useState } from 'react';
import { uploadFile } from '../services/api';

export default function FileUpload({ onUploadSuccess, metadata: externalMetadata }) {
  const [loading, setLoading] = useState(false);

  // Use the metadata passed from App (which is the full upload response object)
  const meta = externalMetadata;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const data = await uploadFile(file);
      if(onUploadSuccess) onUploadSuccess(data); 
    } catch (err) {
      alert("Error uploading file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resolve metadata fields — the upload response has { file_id, filename, metadata: { rows, columns, ... } }
  const rows = meta?.metadata?.rows ?? meta?.rows ?? null;
  const cols = meta?.metadata?.columns ?? meta?.columns ?? null;
  const colCount = Array.isArray(cols) ? cols.length : (typeof cols === 'number' ? cols : null);
  const missing = meta?.metadata?.missing_values ?? meta?.missing_values ?? null;
  const imputed = meta?.metadata?.imputed_values ?? meta?.imputed_values ?? null;
  const filename = meta?.filename ?? 'dataset.csv';

  if (meta) {
    return (
      <div className="relative p-8 bg-white/5 backdrop-blur-xl border border-spatial-glassBorder rounded-3xl text-spatial-text shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-spatial-accent/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-spatial-accent/20 transition-all duration-500"></div>
        
        <div className="flex items-center gap-3 text-spatial-accent mb-6">
          <div className="p-2 bg-spatial-accent/10 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <svg className="w-6 h-6 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <span className="font-semibold text-xl tracking-wide truncate max-w-[200px]" title={filename}>{filename}</span>
        </div>
        
        <h3 className="text-2xl font-bold mb-6 text-white font-['Outfit']">Dataset Ready</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm text-spatial-textDim font-sans">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs uppercase tracking-widest opacity-60 mb-1">Rows</p>
            <p className="text-spatial-text font-medium text-lg">{rows != null ? rows.toLocaleString() : '—'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs uppercase tracking-widest opacity-60 mb-1">Columns</p>
            <p className="text-spatial-text font-medium text-lg">{colCount != null ? colCount.toLocaleString() : '—'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs uppercase tracking-widest opacity-60 mb-1">Missing</p>
            <p className="text-spatial-text font-medium text-lg">{missing != null ? missing.toLocaleString() : '—'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs uppercase tracking-widest opacity-60 mb-1">Imputed</p>
            <p className="text-spatial-text font-medium text-lg">{imputed != null ? imputed.toLocaleString() : '—'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group p-10 bg-white/5 backdrop-blur-xl border border-spatial-glassBorder rounded-3xl text-spatial-text shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] transition-all duration-300 hover:bg-white/10 hover:border-spatial-accent/50 hover:shadow-[0_8px_32px_0_rgba(6,182,212,0.15)] flex flex-col items-center justify-center text-center">
      
      <div className="absolute inset-0 border-2 border-dashed border-spatial-glassBorder rounded-3xl pointer-events-none group-hover:border-spatial-accent/40 transition-colors duration-300 m-4"></div>
      
      <div className="w-16 h-16 mb-6 rounded-2xl bg-spatial-purple/20 flex items-center justify-center text-spatial-purple group-hover:scale-110 group-hover:bg-spatial-accent/20 group-hover:text-spatial-accent transition-all duration-500 shadow-[0_0_20px_rgba(139,92,246,0.2)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
      </div>

      <h3 className="text-2xl font-bold mb-2 text-white font-['Outfit']">Upload Dataset</h3>
      <label className="block text-sm font-medium mb-6 text-spatial-textDim">Select a time-series CSV file</label>
      
      <label className="relative overflow-hidden inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-spatial-purple to-spatial-accent rounded-full cursor-pointer hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all duration-300 transform hover:-translate-y-1">
        <span>Browse Files</span>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>

      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-spatial-bg/80 backdrop-blur-md rounded-3xl">
          <div className="w-12 h-12 border-4 border-spatial-accent/30 border-t-spatial-accent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
          <span className="text-sm font-medium text-spatial-accent animate-pulse">Processing dataset...</span>
        </div>
      )}
    </div>
  );
}
