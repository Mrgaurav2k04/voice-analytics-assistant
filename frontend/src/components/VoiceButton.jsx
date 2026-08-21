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

  const circumference = 2 * Math.PI * 56
  const strokeDashoffset = circumference - (holdProgress / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <svg className="w-36 h-36 md:w-40 md:h-40 transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="56" fill="none" stroke="#1f2937" strokeWidth="4" />
          <circle cx="60" cy="60" r="56" fill="none" stroke="#00d4aa" strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-75 ease-out" style={{ opacity: holdProgress > 0 && holdProgress < 100 ? 1 : 0 }} />
          {isListening && <circle cx="60" cy="60" r="56" fill="none" stroke="#00d4aa" strokeWidth="4" strokeDasharray="20 20" strokeLinecap="round" className="animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />}
        </svg>
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={(e) => { e.preventDefault(); handleMouseDown(e) }}
          onTouchEnd={(e) => { e.preventDefault(); handleMouseUp(e) }}
          disabled={disabled || isProcessing}
          className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
            isListening ? 'bg-terminal-accent/10 border-terminal-accent shadow-[0_0_40px_rgba(0,212,170,0.3)]' : 'bg-terminal-panel border-terminal-border hover:border-terminal-accent/50'
          } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          aria-label={isListening ? 'Release to send' : 'Hold to speak'}
        >
          <svg className={`w-8 h-8 md:w-10 md:h-10 transition-all duration-300 ${isListening ? 'text-terminal-accent animate-pulse' : 'text-terminal-textDim'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-terminal-accent/50 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-terminal-accent/30 animate-ping" style={{ animationDelay: '400ms' }} />
              <div className="absolute inset-4 rounded-full border-2 border-terminal-accent/20 animate-ping" style={{ animationDelay: '800ms' }} />
            </>
          )}
        </button>
      </div>
      <div className="text-center w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className={`status-dot ${isListening ? 'active' : isProcessing ? 'processing' : disabled ? 'inactive' : 'active'}`} />
          <span className="font-mono text-xs uppercase tracking-wider text-terminal-textDim">
            {isListening ? 'LISTENING' : isProcessing ? 'PROCESSING' : disabled ? 'LOCKED' : 'STANDBY'}
          </span>
        </div>
        {isListening && transcript && (
          <div className="bg-terminal-bg border border-terminal-border rounded-lg p-4 min-h-[3rem] text-left">
            <p className="font-mono text-sm text-terminal-text whitespace-pre-wrap">{transcript}<span className="animate-pulse text-terminal-accent">_</span></p>
          </div>
        )}
        {!isListening && !disabled && !isProcessing && <p className="text-terminal-textDim/60 text-xs font-mono uppercase tracking-wider">Hold button for 300ms to activate voice input</p>}
        {!isSupported && <p className="text-red-400/80 text-xs font-mono mt-2">⚠ Speech Recognition unavailable — Use Chrome/Edge</p>}
      </div>
      {isListening && (
        <div className="w-full max-w-md h-8 flex items-end justify-center gap-1">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-1 rounded-full bg-terminal-accent/50" style={{ height: `${Math.max(4, Math.random() * 32)}px`, animationDelay: `${i * 50}ms`, animationDuration: `${300 + Math.random() * 200}ms` }} />
          ))}
        </div>
      )}
    </div>
  )
}