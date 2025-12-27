'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, X, Minimize2, Maximize2 } from 'lucide-react';

// ================================
// QUANTUM NEURAL VOICE WIDGET
// Revolutionary Design by Award-Winning UI/UX
// ================================

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  life: number;
  color: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function QuantumVoiceWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();

  // Initialize particles
  useEffect(() => {
    particlesRef.current = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 400,
      y: Math.random() * 400,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      life: Math.random(),
      color: ['#086c7f', '#06b6d4', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 4)]
    }));
  }, []);

  // Particle animation loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.speedX * (voiceState === 'listening' ? 2 : 1);
        particle.y += particle.speedY * (voiceState === 'listening' ? 2 : 1);

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        // Constrain to canvas
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Pulse life
        particle.life = (particle.life + 0.01) % 1;

        // Draw particle
        const intensity = voiceState === 'speaking' ? audioLevel : Math.sin(particle.life * Math.PI);
        const alpha = 0.3 + intensity * 0.7;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (1 + intensity * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Draw connections
        particlesRef.current.slice(index + 1).forEach(other => {
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            const connectionAlpha = (1 - distance / 100) * 0.2;
            ctx.strokeStyle = `rgba(8, 108, 127, ${connectionAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, voiceState, audioLevel]);

  // Initialize Speech Recognition
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
          if (isListening) {
            recognitionRef.current.start();
          }
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
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setVoiceState('thinking');

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        role: 'assistant',
        content: 'This is a simulated response. Integrate your actual API here.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setVoiceState('speaking');
      
      // Simulate audio level changes
      const interval = setInterval(() => {
        setAudioLevel(Math.random());
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        setVoiceState('idle');
        setAudioLevel(0);
      }, 3000);
    }, 1500);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 group"
            style={{
              width: '80px',
              height: '80px',
            }}
          >
            {/* Quantum Rings */}
            <div className="absolute inset-0">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
                style={{ borderStyle: 'dashed' }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 rounded-full border-2 border-purple-500/30"
                style={{ borderStyle: 'dashed' }}
              />
            </div>

            {/* Glowing Core */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px #086c7f, 0 0 40px #086c7f, 0 0 60px #086c7f',
                  '0 0 30px #8b5cf6, 0 0 60px #8b5cf6, 0 0 90px #8b5cf6',
                  '0 0 20px #086c7f, 0 0 40px #086c7f, 0 0 60px #086c7f',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-3 rounded-full bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Mic className="w-8 h-8 text-white" />
              </motion.div>
            </motion.div>

            {/* Pulse Effect */}
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-cyan-500/30"
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              width: isExpanded ? '90vw' : '420px',
              height: isExpanded ? '90vh' : '600px',
            }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 rounded-3xl overflow-hidden"
            style={{
              maxWidth: isExpanded ? '1400px' : '420px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Background with Glassmorphism */}
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/50 via-purple-950/30 to-pink-950/50" />

            {/* Particle Canvas */}
            <canvas
              ref={canvasRef}
              width={isExpanded ? 1400 : 420}
              height={isExpanded ? 900 : 600}
              className="absolute inset-0 opacity-40"
            />

            {/* Content Container */}
            <div className="relative h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Quantum Avatar */}
                    <motion.div
                      animate={{
                        rotate: voiceState === 'thinking' ? 360 : 0,
                      }}
                      transition={{ duration: 2, repeat: voiceState === 'thinking' ? Infinity : 0 }}
                      className="relative w-14 h-14"
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 blur-xl opacity-70" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">A</span>
                      </div>
                    </motion.div>

                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        Aria
                      </h2>
                      <p className="text-sm text-cyan-300/70">
                        {voiceState === 'idle' && 'Ready to assist'}
                        {voiceState === 'listening' && 'Listening...'}
                        {voiceState === 'thinking' && 'Processing...'}
                        {voiceState === 'speaking' && 'Speaking...'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {isExpanded ? <Minimize2 className="w-5 h-5 text-cyan-300" /> : <Maximize2 className="w-5 h-5 text-cyan-300" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5 text-cyan-300" /> : <Volume2 className="w-5 h-5 text-cyan-300" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 transition-colors"
                    >
                      <X className="w-5 h-5 text-cyan-300" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="inline-block p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                      <p className="text-lg text-cyan-200 mb-2">Welcome to AI Bytes Learning</p>
                      <p className="text-sm text-cyan-300/70">Press the microphone to start talking with Aria</p>
                    </div>
                  </motion.div>
                ) : (
                  messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white'
                            : 'bg-white/10 text-cyan-100 border border-white/20'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </motion.div>
                  ))
                )}

                {/* Live Transcript */}
                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[80%] p-4 rounded-2xl bg-cyan-600/50 border-2 border-cyan-400 border-dashed">
                      <p className="text-sm text-cyan-100">{transcript}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Bottom Controls */}
              <div className="p-6 border-t border-white/10">
                {/* Audio Wave Visualization */}
                {voiceState === 'speaking' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 flex items-center justify-center gap-1 h-12"
                  >
                    {Array.from({ length: 50 }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: [
                            '10%',
                            `${20 + Math.random() * 80}%`,
                            '10%',
                          ],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.02,
                        }}
                        className="w-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full"
                      />
                    ))}
                  </motion.div>
                )}

                {/* Main Control Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleListening}
                  className="w-full relative group"
                >
                  {/* Outer Glow Ring */}
                  <motion.div
                    animate={{
                      scale: isListening ? [1, 1.2, 1] : 1,
                      opacity: isListening ? [0.5, 0, 0.5] : 0.3,
                    }}
                    transition={{ duration: 1.5, repeat: isListening ? Infinity : 0 }}
                    className="absolute inset-0 rounded-full bg-cyan-500/30 blur-xl"
                  />

                  {/* Button Content */}
                  <div className={`relative py-4 px-8 rounded-full font-semibold text-white transition-all ${
                    isListening
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                  }`}>
                    <div className="flex items-center justify-center gap-3">
                      {isListening ? (
                        <>
                          <MicOff className="w-6 h-6" />
                          <span>Stop Listening</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-6 h-6" />
                          <span>Start Listening</span>
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
