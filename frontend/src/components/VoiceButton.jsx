import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function VoiceButton({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition API is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      onTranscript(text);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  return (
    <button
      onClick={startListening}
      className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
        isRecording 
          ? 'bg-red-600 animate-pulse text-white' 
          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
      }`}
    >
      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
      {isRecording ? "Listening..." : "Click to Speak Request"}
    </button>
  );
}