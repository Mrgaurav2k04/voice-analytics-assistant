import React, { useState, useRef, useEffect, useCallback } from 'react';

export function VoiceButton({ onTranscript, disabled, isProcessing }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const recognitionRef = useRef(null)
  const holdTimerRef = useRef(null)
  const progressTimerRef = useRef(null)
  const silenceTimerRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setIsSupported(false); return }
    setIsSupported(true)
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => { setIsListening(true); setTranscript('') }
    recognition.onend = () => { setIsListening(false); if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current) }
    recognition.onerror = (e) => { if (e.error !== 'no-speech' && e.error !== 'aborted') console.error('Speech error:', e.error); setIsListening(false) }
    recognition.onresult = (e) => {
      let final = '', interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        e.results[i].isFinal ? final += t : interim += t
      }
      setTranscript(final + interim)
      if (final) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = setTimeout(() => { onTranscript(final.trim()); recognition.stop() }, 800)
      }
    }
    recognitionRef.current = recognition
    return () => { recognition.abort(); if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current) }
  }, [onTranscript])

  const start = useCallback(() => { if (recognitionRef.current && !isListening) recognitionRef.current.start() }, [isListening])
  const stop = useCallback(() => { if (recognitionRef.current && isListening) recognitionRef.current.stop() }, [isListening])

  const handleMouseDown = (e) => {
    if (disabled || isProcessing || isListening) return
    e.preventDefault()
    setHoldProgress(0)
    holdTimerRef.current = setTimeout(start, 300)
    let progress = 0
    progressTimerRef.current = setInterval(() => { progress += 10; setHoldProgress(Math.min(progress, 100)) }, 30)
  }

  const handleMouseUp = (e) => {
    e.preventDefault()
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null }
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
    setHoldProgress(0)
    if (isListening) stop()
  }

  const handleMouseLeave = () => {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null }
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
    setHoldProgress(0)
  }

  useEffect(() => () => { if (holdTimerRef.current) clearTimeout(holdTimerRef.current); if (progressTimerRef.current) clearInterval(progressTimerRef.current) }, [])

  const circumference = 2 * Math.PI * 64
  const strokeDashoffset = circumference - (holdProgress / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="relative group">
        
        {/* Glow behind orb */}
        <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${isListening ? 'bg-spatial-accent scale-150 opacity-40 animate-pulse' : isProcessing ? 'bg-spatial-purple scale-125 opacity-30 animate-spin-slow' : 'bg-spatial-accent scale-100 opacity-0 group-hover:opacity-20'}`}></div>

        <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="64" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <circle 
            cx="70" cy="70" r="64" fill="none" stroke="#06b6d4" strokeWidth="4" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" className="transition-all duration-75 ease-out drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" 
            style={{ opacity: holdProgress > 0 && holdProgress < 100 ? 1 : 0 }} 
          />
          {isListening && (
            <circle cx="70" cy="70" r="64" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 12" strokeLinecap="round" className="animate-spin-slow drop-shadow-[0_0_10px_rgba(6,182,212,1)]" />
          )}
        </svg>

        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={(e) => { e.preventDefault(); handleMouseDown(e) }}
          onTouchEnd={(e) => { e.preventDefault(); handleMouseUp(e) }}
          disabled={disabled || isProcessing}
          className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden ${
            isListening ? 'scale-95 shadow-[0_0_50px_rgba(6,182,212,0.6)] border border-spatial-accent/50' : 
            'scale-100 shadow-[0_15px_35px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.2)] border border-white/10 hover:border-spatial-accent/30 hover:shadow-[0_15px_40px_rgba(6,182,212,0.3),inset_0_2px_15px_rgba(255,255,255,0.3)]'
          } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed scale-95' : 'cursor-pointer hover:scale-[1.02]'}`}
          aria-label={isListening ? 'Release to send' : 'Hold to speak'}
          style={{
            background: isListening 
              ? 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.4) 0%, rgba(5,5,16,0.9) 100%)' 
              : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.4) 100%)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Internal reflections for 3D orb effect */}
          <div className="absolute top-[5%] left-[15%] w-[70%] h-[30%] rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none transform -rotate-12"></div>
          
          <svg className={`relative z-10 w-12 h-12 transition-all duration-500 ${isListening ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] animate-pulse' : 'text-white/70 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full border border-spatial-accent/50 animate-ping opacity-20" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-2 rounded-full border border-spatial-accent/40 animate-ping opacity-20" style={{ animationDuration: '2s', animationDelay: '600ms' }} />
            </>
          )}
        </button>
      </div>

      <div className="text-center w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-4 bg-white/5 inline-flex px-4 py-1.5 rounded-full border border-white/5">
          <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${isListening ? 'bg-spatial-accent text-spatial-accent animate-pulse' : isProcessing ? 'bg-spatial-purple text-spatial-purple animate-ping' : disabled ? 'bg-gray-500 text-gray-500' : 'bg-spatial-accent/50 text-spatial-accent/50'}`} />
          <span className="font-['Outfit'] font-semibold text-xs uppercase tracking-[0.2em] text-white/80">
            {isListening ? 'Acoustic Link Active' : isProcessing ? 'Analyzing Telemetry' : disabled ? 'System Locked' : 'Awaiting Input'}
          </span>
        </div>
        
        {isListening && transcript && (
          <div className="bg-black/40 backdrop-blur-md border border-spatial-accent/20 rounded-2xl p-5 min-h-[4rem] text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform animate-fade-in-up">
            <p className="font-['Outfit'] text-lg text-white font-light leading-relaxed">{transcript}<span className="animate-pulse text-spatial-accent inline-block ml-1 w-2 h-5 bg-spatial-accent align-middle"></span></p>
          </div>
        )}
        
        {!isListening && !disabled && !isProcessing && <p className="text-spatial-textDim/50 text-xs font-sans font-medium tracking-wide">Press and hold to initiate voice link</p>}
        {!isSupported && <p className="text-spatial-magenta/80 text-xs font-sans mt-2 bg-spatial-magenta/10 py-1 px-3 rounded-full inline-block">⚠ Speech Recognition unavailable — Use Chrome/Edge</p>}
      </div>
    </div>
  )
}