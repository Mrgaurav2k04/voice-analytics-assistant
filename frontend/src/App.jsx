import { useState } from 'react';
import { VoiceButton } from './components/VoiceButton';
import FileUpload from './components/FileUpload';
import Chart from './components/Chart';
import AudioPlayer from './components/AudioPlayer';
import { sendChat } from './services/api';

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
    <div className="min-h-screen bg-terminal-bg text-terminal-text p-4 md:p-8 font-sans selection:bg-terminal-accent/30 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
            Voice Analytics Assistant
          </h1>
          <p className="text-terminal-textDim">Upload a dataset and speak your query.</p>
        </header>
        
        {!datasetMetadata && (
          <div className="max-w-2xl">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {datasetMetadata && chartData.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>
            <div className="flex flex-col items-center justify-center p-8 bg-terminal-panel rounded-xl border border-terminal-border shadow-xl h-full min-h-[300px]">
              <VoiceButton 
                onTranscript={handleVoiceSubmit} 
                disabled={isProcessing} 
                isProcessing={isProcessing} 
              />
            </div>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-8">
                <FileUpload onUploadSuccess={handleUploadSuccess} />
                <div className="flex flex-col items-center justify-center p-6 bg-terminal-panel rounded-xl border border-terminal-border shadow-xl">
                  <VoiceButton 
                    onTranscript={handleVoiceSubmit} 
                    disabled={isProcessing} 
                    isProcessing={isProcessing} 
                  />
                </div>
              </div>
              <div className="lg:col-span-2">
                <Chart data={chartData} />
              </div>
            </div>
            <AudioPlayer audioBase64={audioBase64} />
          </div>
        )}
      </div>
    </div>
  )
}