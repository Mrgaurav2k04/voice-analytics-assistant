import React, { useState } from 'react';
import { uploadFile } from '../services/api';

export default function FileUpload({ onUploadSuccess }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const data = await uploadFile(file);
      setFileName(data.filename);
      onUploadSuccess(data.file_id);
    } catch (err) {
      alert("Error uploading file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-white">
      <label className="block text-sm font-medium mb-2">Upload Time-Series CSV</label>
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
      />
      {loading && <p className="text-xs text-yellow-400 mt-2">Uploading and storing dataset...</p>}
      {fileName && <p className="text-xs text-green-400 mt-2">Loaded: {fileName}</p>}
    </div>
  );
}
