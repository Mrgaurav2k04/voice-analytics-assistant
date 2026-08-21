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
    <div className="min-h-screen text-spatial-text p-4 md:p-8 font-sans selection:bg-spatial-accent/30 selection:text-white relative overflow-hidden">
      
      {/* Background Animated Orbs for Spatial Depth */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-spatial-purple/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob z-0 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-spatial-accent/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000 z-0 pointer-events-none"></div>
      <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-spatial-magenta/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000 z-0 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        <header className="mb-12 text-center pt-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-spatial-accent via-white to-spatial-purple mb-4 font-['Outfit'] drop-shadow-lg">
            Voice Analytics
          </h1>
          <p className="text-spatial-textDim text-lg max-w-2xl mx-auto font-light">
            Upload your dataset and seamlessly explore your time-series data using voice commands.
          </p>
        </header>
        
        {!datasetMetadata && (
          <div className="max-w-2xl mx-auto animate-float-slow">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {datasetMetadata && chartData.length === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            <div className="transition-all duration-500 hover:scale-[1.02]">
              <FileUpload onUploadSuccess={handleUploadSuccess} metadata={datasetMetadata} />
            </div>
            <div className="flex flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-2xl rounded-3xl border border-spatial-glassBorder shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] h-full min-h-[400px]">
              <VoiceButton 
                onTranscript={handleVoiceSubmit} 
                disabled={isProcessing} 
                isProcessing={isProcessing} 
              />
            </div>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 flex flex-col gap-8">
                <div className="flex-1 transition-all duration-500 hover:scale-[1.02]">
                  <FileUpload onUploadSuccess={handleUploadSuccess} metadata={datasetMetadata} />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white/5 backdrop-blur-2xl rounded-3xl border border-spatial-glassBorder shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
                  <VoiceButton 
                    onTranscript={handleVoiceSubmit} 
                    disabled={isProcessing} 
                    isProcessing={isProcessing} 
                  />
                </div>
              </div>
              <div className="lg:col-span-3">
                <div className="bg-white/5 backdrop-blur-2xl border border-spatial-glassBorder p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] h-full transition-all duration-500 hover:border-spatial-glassBorder/80">
                  <Chart data={chartData} />
                </div>
              </div>
            </div>
            <AudioPlayer audioBase64={audioBase64} />
          </div>
        )}
      </div>
    </div>
  )
}