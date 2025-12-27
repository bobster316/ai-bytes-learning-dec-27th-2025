'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Minimize2 } from 'lucide-react';

// ================================
// ULTRA-MINIMAL QUANTUM VOICE WIDGET
// Collapsible to tiny 48px icon
// Expandable to compact 280x360px
// Award-winning effects in smallest footprint
// ================================

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';
type WidgetSize = 'icon' | 'compact' | 'full';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function UltraMinimalVoiceWidget() {
  const [size, setSize] = useState<WidgetSize>('icon');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  const recognitionRef = useRef<any>(null);

  // Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setTranscript(transcript);
        };
        recognitionRef.current.onend = () => {
          if (isListening) recognitionRef.current.start();
        };
      }
    }
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      if (transcript) {
        handleSendMessage(transcript);
        setTranscript('');
      }
      setIsListening(false);
      setVoiceState('idle');
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      setVoiceState('listening');
      if (size === 'icon') setSize('compact');
    }
  };

  const handleSendMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setVoiceState('thinking');

    // TODO: Replace with your API endpoint
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Connect to your /api/voice/message endpoint here' 
      }]);
      setVoiceState('idle');
    }, 1500);
  };

  return (
    <>
      {/* ULTRA-MINIMAL ICON - Only 48px x 48px */}
      <AnimatePresence>
        {size === 'icon' && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSize('compact')}
            className="fixed bottom-4 right-4 z-50"
            style={{ width: '48px', height: '48px' }}
          >
            {/* Quantum ring */}
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                scale: { duration: 2, repeat: Infinity }
              }}
              className="absolute inset-0 rounded-full border-2 border-cyan-400/40"
              style={{ borderStyle: 'dashed' }}
            />

            {/* Glowing core */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 15px #086c7f',
                  '0 0 25px #8b5cf6',
                  '0 0 15px #086c7f',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-1 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center"
            >
              <Mic className="w-5 h-5 text-white" />
            </motion.div>

            {/* Pulse */}
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-cyan-500/30"
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* COMPACT WIDGET - Only 280px x 360px */}
      <AnimatePresence>
        {size === 'compact' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50 rounded-xl overflow-hidden"
            style={{
              width: '280px',
              height: '360px',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" />
            <motion.div
              animate={{
                background: [
                  'radial-gradient(circle at 30% 50%, rgba(8, 108, 127, 0.2) 0%, transparent 50%)',
                  'radial-gradient(circle at 70% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)',
                  'radial-gradient(circle at 30% 50%, rgba(8, 108, 127, 0.2) 0%, transparent 50%)',
                ],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute inset-0"
            />

            <div className="relative h-full flex flex-col">
              {/* Compact header */}
              <div className="p-2.5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: voiceState === 'thinking' ? 360 : 0 }}
                    transition={{ duration: 2, repeat: voiceState === 'thinking' ? Infinity : 0 }}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold"
                  >
                    A
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-cyan-200 truncate">Aria AI</h3>
                    <div className="flex items-center gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                      />
                      <p className="text-xs text-cyan-400/70 truncate">
                        {voiceState === 'idle' && 'Ready'}
                        {voiceState === 'listening' && 'Listening'}
                        {voiceState === 'thinking' && 'Thinking'}
                        {voiceState === 'speaking' && 'Speaking'}
                      </p>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSize('icon')}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-cyan-300" />
                </motion.button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                {messages.length === 0 ? (
                  <div className="text-center py-6">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-block p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20"
                    >
                      <p className="text-cyan-200 text-xs font-medium">Talk to Aria</p>
                      <p className="text-cyan-400/60 text-xs mt-0.5">Press mic button</p>
                    </motion.div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[90%] p-2 rounded-lg text-xs ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white'
                            : 'bg-white/10 text-cyan-100 border border-white/20'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))
                )}

                {transcript && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[90%] p-2 rounded-lg bg-cyan-600/50 border border-cyan-400 border-dashed text-xs text-cyan-100">
                      {transcript}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Compact button */}
              <div className="p-2.5 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleListening}
                  className={`w-full py-2.5 px-3 rounded-full font-semibold text-white text-xs transition-all ${
                    isListening
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                  }`}
                  style={{
                    boxShadow: isListening
                      ? '0 4px 15px rgba(239, 68, 68, 0.4)'
                      : '0 4px 15px rgba(8, 108, 127, 0.4)',
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>Stop Listening</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>Start Talking</span>
                      </>
                    )}
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
