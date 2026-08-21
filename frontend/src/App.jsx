import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import VoiceButton from './components/VoiceButton';
import Chart from './components/Chart';
import AudioPlayer from './components/AudioPlayer';
import { sendChat } from './services/api';

export default function App() {
  const [fileId, setFileId] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [agentText, setAgentText] = useState("");
  const [audioBase64, setAudioBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTranscript = async (transcript) => {
    if (!fileId) {
      alert("Please upload a CSV file first!");
      return;
    }
    
    setLoading(true);
    setAgentText(`Processing: "${transcript}"...`);
    try {
      const res = await sendChat(transcript, fileId);
      setAgentText(res.text);
      setChartData(res.chart_payload.data);
      setAudioBase64(res.audio_base64);
    } catch (err) {
      setAgentText("Error communicating with backend.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">Generative UI Voice Analytics</h1>
          <p className="text-sm text-slate-400">Autonomous Implantation, Forecasting & Voice Agent</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUpload onUploadSuccess={(id) => setFileId(id)} />
          <div className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-lg">
            <VoiceButton onTranscript={handleTranscript} />
            {loading && <p className="text-xs text-indigo-400 mt-2">Agent is thinking...</p>}
          </div>
        </div>

        {agentText && (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-indigo-300 text-sm">
            <strong>Agent Response:</strong> {agentText}
          </div>
        )}

        <Chart chartData={chartData} />
        <AudioPlayer audioBase64={audioBase64} />
      </div>
    </div>
  );
}