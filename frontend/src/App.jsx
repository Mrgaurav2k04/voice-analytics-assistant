import { useState } from 'react';
import FileUpload from './components/FileUpload';
import VoiceButton from './components/VoiceButton';
import Chart from './components/Chart';
import AudioPlayer from './components/AudioPlayer';
import mockResponse from '../mocks/chat_response.json';

export default function App() {
  // const [datasetMetadata, setDatasetMetadata] = useState(null);
  const [datasetMetadata, setDatasetMetadata] = useState({ ready: true });
  const [chartData, setChartData] = useState([]);
  const [audioBase64, setAudioBase64] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Triggered when FileUpload.jsx finishes the CSV upload
  const handleUploadSuccess = (metadata) => {
    setDatasetMetadata(metadata);
  };

  // Triggered when VoiceButton.jsx finishes listening
  const handleVoiceSubmit = async (transcript) => {
    setIsProcessing(true);
    console.log("User said:", transcript);

    // ==========================================
    // TEMPORARY MOCK INJECTION:
    // We use a 1-second timeout to simulate backend processing
    // ==========================================
    setTimeout(() => {
      setChartData(mockResponse.chart_payload.data);
      setAudioBase64(mockResponse.audio_base64);
      setIsProcessing(false);
    }, 1000);

    /*
    // ⚠️ REAL API CALL (COMMENTED OUT UNTIL BACKEND IS READY):
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: transcript, file_id: "mock_123" })
      });
      const data = await response.json();
      setChartData(data.chart_payload.data);
      setAudioBase64(data.audio_base64);
    } catch (error) {
      console.error("Chat API failed", error);
    } finally {
      setIsProcessing(false);
    }
    */
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Voice Analytics Assistant</h1>
        
        {/* 1. Upload UI & Dataset Ready State */}
        <FileUpload onUploadSuccess={handleUploadSuccess} />

        {/* 2. Voice Input (Only shows if dataset is ready) */}
        {datasetMetadata && (
          <div className="flex flex-col items-center justify-center p-6 bg-gray-900 rounded-lg border border-gray-800 shadow-sm">
            <VoiceButton onSubmit={handleVoiceSubmit} disabled={isProcessing} />
            {isProcessing && <p className="mt-4 text-sm text-gray-400 animate-pulse">Processing request...</p>}
          </div>
        )}

        {/* 3. Result Display */}
        {chartData.length > 0 && (
          <>
            <Chart data={chartData} />
            <AudioPlayer base64Audio={audioBase64} />
          </>
        )}
      </div>
    </div>
  );
}