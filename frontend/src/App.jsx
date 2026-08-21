import { useState } from 'react';
import { VoiceButton } from './components/VoiceButton';
import FileUpload from './components/FileUpload';
import Chart from './components/Chart';
import AudioPlayer from './components/AudioPlayer';
import { uploadFile, sendChat } from './services/api';

export default function App() {
  const [datasetMetadata, setDatasetMetadata] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [audioBase64, setAudioBase64] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadSuccess = (metadata) => {
    setDatasetMetadata(metadata);
  };

  const handleVoiceSubmit = async (transcript) => {
    if (!datasetMetadata?.file_id) return;
    
    setIsProcessing(true);
    console.log('[App] User said:', transcript);

    try {
      const response = await sendChat(transcript, datasetMetadata.file_id);
      setChartData(response.chart_payload.data);
      setAudioBase64(response.audio_base64);
    } catch (error) {
      console.error('[App] Chat API failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Voice Analytics Assistant</h1>
        
        <FileUpload onUploadSuccess={handleUploadSuccess} />

        {datasetMetadata && (
          <div className="flex flex-col items-center justify-center p-6 bg-gray-900 rounded-lg border border-gray-800 shadow-sm">
            <VoiceButton 
              onTranscript={handleVoiceSubmit} 
              disabled={isProcessing} 
              isProcessing={isProcessing} 
            />
            {isProcessing && <p className="mt-4 text-sm text-gray-400 animate-pulse">Processing request...</p>}
          </div>
        )}

        {chartData.length > 0 && (
          <>
            <Chart data={chartData} />
            <AudioPlayer base64Audio={audioBase64} />
          </>
        )}
      </div>
    </div>
  )
}