'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, X, Minimize2, Maximize2, Sparkles, Zap } from 'lucide-react';

// ================================
// QUANTUM NEURAL VOICE WIDGET V2
// Ultimate Award-Winning Design
// Features:
// - 3D Particle Orbital System
// - Neural Network Visualization
// - Quantum Morphing Effects
// - Real-time Audio Reactive
// - Fluid State Transitions
// - Advanced Glassmorphism
// ================================

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Particle3D {
  id: number;
  angle: number;
  radius: number;
  z: number;
  speed: number;
  size: number;
  color: string;
  pulse: number;
}

interface NeuralNode {
  x: number;
  y: number;
  connections: number[];
  activity: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function QuantumVoiceWidgetV2() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [neuralActivity, setNeuralActivity] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles3DRef = useRef<Particle3D[]>([]);
  const neuralNodesRef = useRef<NeuralNode[]>([]);
  const animationFrameRef = useRef<number>();
  const recognitionRef = useRef<any>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);

  // Initialize 3D particles
  useEffect(() => {
    particles3DRef.current = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      angle: (i / 60) * Math.PI * 2,
      radius: 80 + Math.random() * 60,
      z: Math.random() * 200 - 100,
      speed: 0.01 + Math.random() * 0.02,
      size: 2 + Math.random() * 4,
      color: ['#086c7f', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'][Math.floor(Math.random() * 5)],
      pulse: Math.random() * Math.PI * 2,
    }));

    // Initialize neural network nodes
    const nodes: NeuralNode[] = [];
    for (let i = 0; i < 15; i++) {
      nodes.push({
        x: Math.random() * 400,
        y: Math.random() * 600,
        connections: [],
        activity: 0,
      });
    }

    // Create connections
    nodes.forEach((node, i) => {
      const numConnections = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numConnections; j++) {
        const targetIndex = Math.floor(Math.random() * nodes.length);
        if (targetIndex !== i && !node.connections.includes(targetIndex)) {
          node.connections.push(targetIndex);
        }
      }
    });

    neuralNodesRef.current = nodes;
  }, []);

  // Main animation loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw neural network in background
      if (voiceState === 'thinking') {
        neuralNodesRef.current.forEach((node, i) => {
          // Update activity
          node.activity = Math.max(0, node.activity - 0.02);
          if (Math.random() < 0.05) {
            node.activity = 1;
          }

          // Draw connections
          node.connections.forEach(targetIndex => {
            const target = neuralNodesRef.current[targetIndex];
            const gradient = ctx.createLinearGradient(node.x, node.y, target.x, target.y);
            gradient.addColorStop(0, `rgba(8, 108, 127, ${node.activity * 0.5})`);
            gradient.addColorStop(1, `rgba(139, 92, 246, ${target.activity * 0.5})`);

            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1 + node.activity * 2;
            ctx.stroke();
          });

          // Draw node
          const pulseSize = 4 + node.activity * 6;
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, pulseSize);
          gradient.addColorStop(0, `rgba(6, 182, 212, ${node.activity})`);
          gradient.addColorStop(1, `rgba(6, 182, 212, 0)`);

          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        });
      }

      // Draw 3D particles
      particles3DRef.current.forEach(particle => {
        // Update angle
        particle.angle += particle.speed * (voiceState === 'listening' ? 2 : 1);
        particle.pulse += 0.05;

        // Calculate 3D position
        const x = centerX + Math.cos(particle.angle) * particle.radius;
        const y = centerY + Math.sin(particle.angle) * particle.radius + Math.sin(particle.pulse) * 20;
        const z = particle.z + Math.sin(particle.angle + particle.pulse) * 30;

        // Perspective projection
        const scale = 200 / (200 + z);
        const projX = centerX + (x - centerX) * scale;
        const projY = centerY + (y - centerY) * scale;
        const size = particle.size * scale;

        // Draw particle
        const intensity = voiceState === 'speaking' ? audioLevel : Math.sin(particle.pulse);
        const alpha = 0.4 + intensity * 0.6;

        // Convert hex to RGB for gradient
        const hexToRgb = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return { r, g, b };
        };

        const rgb = hexToRgb(particle.color);

        // Glow effect with RGBA
        const gradient = ctx.createRadialGradient(projX, projY, 0, projX, projY, size * 3);
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`);
        gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.beginPath();
        ctx.arc(projX, projY, size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(projX, projY, size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });

      // Draw central quantum core
      const coreSize = 40 + (voiceState === 'listening' ? 20 : 0) + audioLevel * 30;
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize);

      if (voiceState === 'listening') {
        coreGradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
        coreGradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
        coreGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else {
        coreGradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
        coreGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.4)');
        coreGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

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

    // Activate neural network
    setNeuralActivity(1);
    const activityInterval = setInterval(() => {
      setNeuralActivity(prev => Math.max(0, prev - 0.1));
    }, 100);

    // Call Gemini API endpoint
    try {
      const response = await fetch('/api/voice/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      clearInterval(activityInterval);

      const aiMessage: Message = {
        role: 'assistant',
        content: data.response || data.text || 'Sorry, I encountered an error.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setVoiceState('speaking');

      // Play audio if available from ElevenLabs
      if (data.audio && !isMuted) {
        const audio = new Audio(data.audio);
        const audioInterval = setInterval(() => {
          setAudioLevel(Math.random());
        }, 100);

        audio.onended = () => {
          clearInterval(audioInterval);
          setVoiceState('idle');
          setAudioLevel(0);
        };

        audio.onerror = () => {
          clearInterval(audioInterval);
          setVoiceState('idle');
          setAudioLevel(0);
        };

        audio.play().catch(() => {
          clearInterval(audioInterval);
          setVoiceState('idle');
        });
      } else {
        setTimeout(() => {
          setVoiceState('idle');
        }, 2000);
      }
    } catch (error) {
      clearInterval(activityInterval);
      console.error('Voice API Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Could you try again?',
        timestamp: new Date()
      }]);
      setVoiceState('idle');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <>
      {/* Floating Trigger Button - Ultra Enhanced */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="fixed bottom-6 right-6 z-50"
            style={{ width: '90px', height: '90px' }}
          >
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="relative w-full h-full group"
              style={{ perspective: '1000px' }}
            >
              {/* Orbital Rings */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 2, repeat: Infinity },
                }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40" style={{ borderStyle: 'dashed' }} />
              </motion.div>

              <motion.div
                animate={{
                  rotate: -360,
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 3, repeat: Infinity },
                }}
                className="absolute inset-3"
              >
                <div className="absolute inset-0 rounded-full border-2 border-purple-400/40" style={{ borderStyle: 'dotted' }} />
              </motion.div>

              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 4, repeat: Infinity },
                }}
                className="absolute inset-6"
              >
                <div className="absolute inset-0 rounded-full border-2 border-pink-400/40" style={{ borderStyle: 'dashed' }} />
              </motion.div>

              {/* Glowing Core with morphing gradient */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 30px #086c7f, 0 0 60px #086c7f, 0 0 90px #086c7f',
                    '0 0 40px #8b5cf6, 0 0 80px #8b5cf6, 0 0 120px #8b5cf6',
                    '0 0 35px #ec4899, 0 0 70px #ec4899, 0 0 105px #ec4899',
                    '0 0 30px #086c7f, 0 0 60px #086c7f, 0 0 90px #086c7f',
                  ],
                  background: [
                    'linear-gradient(135deg, #086c7f 0%, #8b5cf6 100%)',
                    'linear-gradient(225deg, #8b5cf6 0%, #ec4899 100%)',
                    'linear-gradient(315deg, #ec4899 0%, #086c7f 100%)',
                    'linear-gradient(135deg, #086c7f 0%, #8b5cf6 100%)',
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-4 rounded-full flex items-center justify-center"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
              </motion.div>

              {/* Multiple Pulse Effects */}
              {[0, 0.33, 0.66].map((delay, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 2, 2],
                    opacity: [0.6, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: delay * 2,
                  }}
                  className="absolute inset-0 rounded-full bg-cyan-500/40"
                />
              ))}

              {/* Sparkle particles around button */}
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    x: [0, Math.cos(i * Math.PI / 4) * 50, 0],
                    y: [0, Math.sin(i * Math.PI / 4) * 50, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.25,
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400" />
                </motion.div>
              ))}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Widget - Ultra Enhanced */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50, rotateX: -15 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              rotateX: 0,
              width: isExpanded ? '90vw' : '450px',
              height: isExpanded ? '90vh' : '650px',
            }}
            exit={{ scale: 0.8, opacity: 0, y: 50, rotateX: -15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onMouseMove={handleMouseMove}
            className="fixed bottom-6 right-6 z-50 rounded-3xl overflow-hidden"
            style={{
              maxWidth: isExpanded ? '1400px' : '450px',
              transformStyle: 'preserve-3d',
              boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.7), 0 30px 60px -30px rgba(8, 108, 127, 0.5)',
            }}
          >
            {/* Multi-layered Background */}
            <div className="absolute inset-0 bg-slate-950" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
            <div className="absolute inset-0 backdrop-blur-3xl bg-slate-950/90" />

            {/* Animated Gradient Mesh */}
            <motion.div
              animate={{
                background: [
                  'radial-gradient(circle at 20% 50%, rgba(8, 108, 127, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 50%, rgba(8, 108, 127, 0.3) 0%, transparent 50%)',
                ],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute inset-0"
            />

            {/* Particle Canvas */}
            <canvas
              ref={canvasRef}
              width={isExpanded ? 1400 : 450}
              height={isExpanded ? 900 : 650}
              className="absolute inset-0 opacity-60"
            />

            {/* Noise Texture Overlay */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'3.5\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
              }}
            />

            {/* Content Container with Glassmorphism */}
            <motion.div
              className="relative h-full flex flex-col backdrop-blur-sm bg-white/5"
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Quantum Avatar */}
                    <motion.div
                      animate={{
                        rotate: voiceState === 'thinking' ? [0, 360] : 0,
                      }}
                      transition={{ duration: 3, repeat: voiceState === 'thinking' ? Infinity : 0, ease: 'linear' }}
                      className="relative w-16 h-16"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Orbital rings */}
                      <motion.div
                        animate={{ rotateY: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0"
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30" style={{ transform: 'rotateX(60deg)' }} />
                      </motion.div>

                      <motion.div
                        animate={{ rotateX: 360 }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0"
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <div className="absolute inset-0 rounded-full border-2 border-purple-400/30" style={{ transform: 'rotateY(60deg)' }} />
                      </motion.div>

                      {/* Core */}
                      <motion.div
                        animate={{
                          boxShadow: [
                            '0 0 20px #086c7f',
                            '0 0 40px #8b5cf6',
                            '0 0 20px #086c7f',
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold"
                      >
                        A
                      </motion.div>
                    </motion.div>

                    <div>
                      <motion.h2
                        className="text-2xl font-bold"
                        style={{
                          backgroundImage: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)',
                          backgroundSize: '200% 100%',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                        animate={{
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{ duration: 5, repeat: Infinity }}
                      >
                        Aria
                      </motion.h2>
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-cyan-400"
                        />
                        <p className="text-sm text-cyan-300/80">
                          {voiceState === 'idle' && 'Neural pathways ready'}
                          {voiceState === 'listening' && 'Quantum receptors active'}
                          {voiceState === 'thinking' && 'Synapses processing...'}
                          {voiceState === 'speaking' && 'Transmitting response...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-3 rounded-full bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all border border-white/10"
                    >
                      {isExpanded ? <Minimize2 className="w-5 h-5 text-cyan-300" /> : <Maximize2 className="w-5 h-5 text-cyan-300" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-3 rounded-full bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all border border-white/10"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5 text-cyan-300" /> : <Volume2 className="w-5 h-5 text-cyan-300" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsOpen(false)}
                      className="p-3 rounded-full bg-gradient-to-br from-white/10 to-white/5 hover:from-red-500/20 hover:to-red-500/10 transition-all border border-white/10"
                    >
                      <X className="w-5 h-5 text-cyan-300" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Messages Area with Scrollbar */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="inline-block p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border-2 border-cyan-500/20 backdrop-blur-xl"
                    >
                      <Zap className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                      <p className="text-xl text-cyan-200 mb-2 font-semibold">Welcome to AI Bytes Learning</p>
                      <p className="text-sm text-cyan-300/70">Activate the quantum interface to begin your learning journey</p>
                    </motion.div>
                  </motion.div>
                ) : (
                  messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: message.role === 'user' ? 50 : -50, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02, translateZ: 10 }}
                        className={`max-w-[80%] p-5 rounded-3xl backdrop-blur-xl ${message.role === 'user'
                          ? 'bg-gradient-to-br from-cyan-600/90 to-cyan-700/90 text-white border border-cyan-400/30'
                          : 'bg-gradient-to-br from-white/10 to-white/5 text-cyan-100 border border-white/20'
                          }`}
                        style={{
                          boxShadow: message.role === 'user'
                            ? '0 8px 32px rgba(8, 108, 127, 0.3)'
                            : '0 8px 32px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs opacity-50 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </motion.div>
                    </motion.div>
                  ))
                )}

                {/* Live Transcript with quantum effect */}
                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end"
                  >
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(6, 182, 212, 0.5)',
                          '0 0 40px rgba(139, 92, 246, 0.5)',
                          '0 0 20px rgba(6, 182, 212, 0.5)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="max-w-[80%] p-5 rounded-3xl bg-gradient-to-br from-cyan-600/50 to-purple-600/50 border-2 border-cyan-400 backdrop-blur-xl"
                      style={{ borderStyle: 'dashed' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-red-400"
                        />
                        <span className="text-xs text-cyan-200">Recording...</span>
                      </div>
                      <p className="text-sm text-cyan-100">{transcript}</p>
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* Bottom Controls */}
              <div className="p-6 border-t border-white/10 bg-gradient-to-t from-black/20 to-transparent">
                {/* Advanced Audio Wave Visualization */}
                {voiceState === 'speaking' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mb-6 relative h-16 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 overflow-hidden"
                  >
                    <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-2">
                      {Array.from({ length: 100 }).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: [
                              '20%',
                              `${20 + Math.sin(i * 0.1) * 30 + Math.random() * 50}%`,
                              '20%',
                            ],
                          }}
                          transition={{
                            duration: 0.3,
                            repeat: Infinity,
                            delay: i * 0.01,
                          }}
                          className="flex-1 rounded-full"
                          style={{
                            background: `linear-gradient(to top, #06b6d4, #8b5cf6)`,
                            minWidth: '2px',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Main Control Button - Revolutionary Design */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={toggleListening}
                  className="w-full relative group overflow-hidden"
                >
                  {/* Animated background layers */}
                  <motion.div
                    animate={{
                      scale: isListening ? [1, 1.2, 1] : 1,
                      opacity: isListening ? [0.3, 0, 0.3] : 0.2,
                    }}
                    transition={{ duration: 1.5, repeat: isListening ? Infinity : 0 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 blur-2xl"
                  />

                  <motion.div
                    animate={{
                      scale: isListening ? [1, 1.4, 1] : 1,
                      opacity: isListening ? [0.5, 0, 0.5] : 0.3,
                    }}
                    transition={{ duration: 2, repeat: isListening ? Infinity : 0, delay: 0.5 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-xl"
                  />

                  {/* Button surface */}
                  <motion.div
                    className="relative py-5 px-10 rounded-full font-semibold text-white transition-all backdrop-blur-sm"
                    style={{
                      background: isListening
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                        : 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
                      boxShadow: isListening
                        ? '0 10px 40px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        : '0 10px 40px rgba(8, 108, 127, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      animate={{
                        x: ['-200%', '200%'],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />

                    <div className="relative flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ rotate: isListening ? 360 : 0 }}
                        transition={{ duration: 2, repeat: isListening ? Infinity : 0, ease: 'linear' }}
                      >
                        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </motion.div>
                      <span className="text-lg">
                        {isListening ? 'Quantum Link Active' : 'Activate Neural Interface'}
                      </span>
                    </div>
                  </motion.div>
                </motion.button>

                {/* Status Indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex items-center justify-center gap-4 text-xs text-cyan-300/60"
                >
                  <div className="flex items-center gap-1">
                    <motion.div
                      animate={{
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                    />
                    <span>Real-time Processing</span>
                  </div>
                  <div className="w-px h-3 bg-cyan-500/20" />
                  <div className="flex items-center gap-1">
                    <motion.div
                      animate={{
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="w-1.5 h-1.5 rounded-full bg-purple-400"
                    />
                    <span>Neural Network Active</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
