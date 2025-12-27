'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Send } from 'lucide-react';

// ================================
// MINIMAL QUANTUM VOICE WIDGET
// Award-winning design in compact form
// Takes minimal space on page
// ================================

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function MinimalQuantumVoiceWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number>();
  const recognitionRef = useRef<any>(null);

  // Initialize minimal particles (only 20 for performance)
  useEffect(() => {
    particlesRef.current = Array.from({ length: 20 }, (_, i) => ({
      angle: (i / 20) * Math.PI * 2,
      radius: 15 + Math.random() * 10,
      speed: 0.02 + Math.random() * 0.03,
      size: 1 + Math.random() * 2,
      color: ['#086c7f', '#06b6d4', '#8b5cf6'][Math.floor(Math.random() * 3)],
    }));
  }, []);

  // Compact particle animation
  useEffect(() => {
    if (!isOpen && voiceState === 'idle') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      particlesRef.current.forEach(particle => {
        particle.angle += particle.speed * (isListening ? 2 : 1);
        const x = centerX + Math.cos(particle.angle) * particle.radius;
        const y = centerY + Math.sin(particle.angle) * particle.radius;

        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + (isListening ? 'ff' : '88');
        ctx.fill();
      });

      // Compact quantum core
      const coreSize = isListening ? 15 : 10;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize);
      gradient.addColorStop(0, isListening ? '#ef4444' : '#06b6d4');
      gradient.addColorStop(1, isListening ? '#dc262600' : '#8b5cf600');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, voiceState, isListening]);

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
    }
  };

  const handleSendMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setVoiceState('thinking');

    // TODO: Replace with your API call
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Connect to /api/voice/message endpoint' 
      }]);
      setVoiceState('idle');
    }, 1500);
  };

  return (
    <>
      {/* Minimal Floating Button - Only 64px */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 z-50"
            style={{ width: '64px', height: '64px' }}
          >
            {/* Quantum rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
              style={{ borderStyle: 'dashed' }}
            />
            
            {/* Core */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px #086c7f',
                  '0 0 30px #8b5cf6',
                  '0 0 20px #086c7f',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center"
            >
              <canvas ref={canvasRef} width="60" height="60" className="absolute inset-0" />
              <Mic className="w-6 h-6 text-white relative z-10" />
            </motion.div>

            {/* Pulse */}
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-cyan-500/30"
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Compact Widget - Only 320px x 400px */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50 rounded-2xl overflow-hidden"
            style={{
              width: '320px',
              height: '400px',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Compact background */}
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-purple-950/20 to-pink-950/30" />

            {/* Content */}
            <div className="relative h-full flex flex-col">
              {/* Minimal header */}
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: voiceState === 'thinking' ? 360 : 0 }}
                    transition={{ duration: 2, repeat: voiceState === 'thinking' ? Infinity : 0 }}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold"
                  >
                    A
                  </motion.div>
                  <div>
                    <h3 className="text-sm font-bold text-cyan-200">Aria</h3>
                    <p className="text-xs text-cyan-400/60">
                      {voiceState === 'idle' && 'Ready'}
                      {voiceState === 'listening' && 'Listening...'}
                      {voiceState === 'thinking' && 'Thinking...'}
                      {voiceState === 'speaking' && 'Speaking...'}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20"
                >
                  <X className="w-4 h-4 text-cyan-300" />
                </motion.button>
              </div>

              {/* Compact messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-block p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                      <p className="text-cyan-200 text-xs">Press mic to talk</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-2.5 rounded-xl text-xs ${
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
                    <div className="max-w-[85%] p-2.5 rounded-xl bg-cyan-600/50 border-2 border-cyan-400 border-dashed text-xs text-cyan-100">
                      {transcript}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Compact controls */}
              <div className="p-3 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleListening}
                  className="w-full relative"
                >
                  <div
                    className={`py-3 px-4 rounded-full font-semibold text-white text-sm transition-all ${
                      isListening
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                    }`}
                    style={{
                      boxShadow: isListening
                        ? '0 4px 20px rgba(239, 68, 68, 0.4)'
                        : '0 4px 20px rgba(8, 108, 127, 0.4)',
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isListening ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span>Talk to Aria</span>
                        </>
                      )}
                    </div>
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
