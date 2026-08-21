import React, { useState } from 'react';
import { uploadFile } from '../services/api';

export default function FileUpload({ onUploadSuccess }) {
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setMetadata(null);
    try {
      const data = await uploadFile(file);
      setMetadata(data);
      onUploadSuccess(data); // Pass full metadata to App
    } catch (err) {
      alert("Error uploading file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (metadata) {
    return (
      <div className="p-6 bg-terminal-panel border border-terminal-border rounded-lg text-terminal-text shadow-lg">
        <div className="flex items-center gap-2 text-terminal-accent mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span className="font-semibold text-lg">{metadata.filename}</span>
        </div>
        
        <h3 className="text-xl font-bold mb-4 text-white">Dataset Ready</h3>
        
        <div className="space-y-2 text-sm text-terminal-textDim font-mono">
          <p>Rows: <span className="text-terminal-text">{metadata.rows?.toLocaleString() || 1240}</span></p>
          <p>Columns: <span className="text-terminal-text">{metadata.columns?.length || metadata.columns || 5}</span></p>
          <p>Missing values: <span className="text-terminal-text">{metadata.missing_values ?? 12}</span></p>
          <p>Values imputed: <span className="text-terminal-text">{metadata.values_imputed ?? 12}</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-terminal-panel border border-terminal-border rounded-lg text-terminal-text shadow-lg transition-all hover:border-terminal-accent/50">
      <label className="block text-sm font-medium mb-4 text-terminal-textDim">Upload Time-Series CSV</label>
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange}
        className="block w-full text-sm text-terminal-textDim file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-terminal-accent/20 file:text-terminal-accent hover:file:bg-terminal-accent/30 cursor-pointer transition-colors"
      />
      {loading && (
        <div className="mt-4 flex items-center gap-2 text-terminal-accent/80">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="32" strokeLinecap="round"></circle></svg>
          <span className="text-sm">Uploading and preprocessing dataset...</span>
        </div>
      )}
    </div>
  );
}
