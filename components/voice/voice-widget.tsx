"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, X, MessageSquare, Volume2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
// import { VoiceAvatar } from "./voice-avatar";

export function VoiceWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("");
    const [hasGreeted, setHasGreeted] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const loadVoices = () => {
            const available = window.speechSynthesis.getVoices();
            console.log("Voices loaded:", available.map(v => v.name));
            setVoices(available);
        };

        loadVoices();

        // Chrome loads voices asynchronously
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Initial Greeting
    useEffect(() => {
        if (isOpen && !hasGreeted) {
            const greeting = "Hello! I am Aria, your AI tutor. How can I help you today?";
            setResponse(greeting);

            // Fetch audio for consistency
            fetch("/api/voice/speak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: greeting }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.audio) {
                        playAudio(data.audio);
                    } else {
                        speak(greeting); // Fallback
                    }
                })
                .catch(() => speak(greeting));

            setHasGreeted(true);
        }
    }, [isOpen, hasGreeted]);



    // Toggle widget
    const toggleOpen = () => setIsOpen(!isOpen);

    // Speech Recognition Setup
    useEffect(() => {
        if (!("webkitSpeechRecognition" in window)) {
            console.warn("Speech recognition not supported");
            return;
        }
    }, []);

    const startListening = () => {
        if (!("webkitSpeechRecognition" in window)) return;

        // @ts-ignore
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            handleSendMessage(text);
        };

        recognition.onerror = (event: any) => {
            // Ignore benign errors that are part of normal UX flow
            const benignErrors = ['aborted', 'no-speech', 'audio-capture'];

            if (!benignErrors.includes(event.error)) {
                console.error("Speech recognition error", event.error);

                // Show user-friendly message for critical errors
                if (event.error === 'not-allowed') {
                    setResponse("Please enable microphone permissions to use voice chat.");
                }
            }

            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const handleSendMessage = async (text: string) => {
        try {
            // Get course context from URL (basic implementation)
            const path = window.location.pathname;
            const context = {
                path,
                // Attempt to parse courseId if in /courses/[id]
                courseId: path.includes('/courses/') ? path.split('/')[2] : undefined
            };

            const res = await fetch("/api/voice/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, context }),
            });

            const data = await res.json();

            if (data.text) {
                setResponse(data.text);

                if (data.audio) {
                    playAudio(data.audio);
                } else {
                    speak(data.text);
                }
            }
        } catch (err) {
            console.error("Chat error", err);
            const errorMsg = "I'm having trouble connecting. Please try again.";
            setResponse(errorMsg);
            speak(errorMsg);
        }
    };

    const playAudio = (audioSrc: string) => {
        setIsSpeaking(true);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        const audio = new Audio(audioSrc);
        audioRef.current = audio;

        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
            console.error("Audio playback error");
            setIsSpeaking(false);
        };
        audio.play().catch(e => {
            console.error("Audio play failed:", e);
            setIsSpeaking(false);
        });
    };

    const speak = (text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // Select Voice: Priority -> Aria, Zira, Google US English, any English
        if (voices.length > 0) {
            const preferredVoice = voices.find(v => v.name.includes("Aria") || v.name.includes("Zira") || v.name.includes("Google US English"));
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            } else {
                // Fallback to any English voice
                const englishVoice = voices.find(v => v.lang.startsWith("en"));
                if (englishVoice) utterance.voice = englishVoice;
            }
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsSpeaking(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border-2 border-slate-300/60 dark:border-slate-600/60 w-60 overflow-hidden ring-1 ring-black/10 dark:ring-white/10"
                        style={{
                            transform: 'translateZ(0)',
                            boxShadow: '0 20px 60px -15px rgba(0, 191, 165, 0.15), 0 10px 30px -10px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        {/* Header */}
                        <div
                            className="p-3.5 bg-gradient-to-r from-[#0A1628] via-[#0D1F3C] to-[#0A1628] text-white flex justify-between items-center border-b border-white/10"
                            style={{
                                boxShadow: 'inset 0 -1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.15)'
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <div className="w-3 h-3 rounded-full bg-[#00BFA5] animate-pulse" />
                                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#00BFA5] animate-ping opacity-75" />
                                </div>
                                <div>
                                    <span className="font-semibold text-xs">Aria</span>
                                    <p className="text-[10px] text-emerald-400 font-medium">AI Assistant</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={toggleOpen} className="text-white hover:bg-white/10 h-6 w-6 rounded-lg transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        {/* Visualizer Area */}
                        <div
                            className="relative h-28 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center overflow-hidden"
                            style={{
                                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 -1px 2px rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            {/* Animated background pattern */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                                    backgroundSize: '24px 24px'
                                }} />
                            </div>

                            {isSpeaking ? (
                                <div className="flex items-center gap-1.5 h-full relative z-10">
                                    {[...Array(5)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 bg-gradient-to-t from-[#00BFA5] to-[#00E5CC] rounded-full shadow-lg shadow-[#00BFA5]/30"
                                            animate={{
                                                height: ["15%", "75%", "15%"],
                                            }}
                                            transition={{
                                                duration: 0.5,
                                                repeat: Infinity,
                                                delay: i * 0.08,
                                                ease: "easeInOut",
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    className="relative"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <svg className="w-12 h-12 text-[#00BFA5]/20" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                                        <circle cx="6" cy="8" r="2" fill="currentColor" />
                                        <circle cx="18" cy="8" r="2" fill="currentColor" />
                                        <circle cx="6" cy="16" r="2" fill="currentColor" />
                                        <circle cx="18" cy="16" r="2" fill="currentColor" />
                                        <line x1="12" y1="9" x2="8" y2="8" stroke="currentColor" strokeWidth="2" />
                                        <line x1="12" y1="9" x2="16" y2="8" stroke="currentColor" strokeWidth="2" />
                                        <line x1="12" y1="15" x2="8" y2="16" stroke="currentColor" strokeWidth="2" />
                                        <line x1="12" y1="15" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </motion.div>
                            )}

                            {/* Listening Overlay */}
                            {isListening && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-gradient-to-br from-[#00BFA5]/20 via-[#00E5CC]/20 to-[#00BFA5]/20 flex items-center justify-center z-10 backdrop-blur-md"
                                >
                                    <div className="flex gap-1.5">
                                        {[0, 200, 400].map((delay, i) => (
                                            <motion.div
                                                key={i}
                                                className="w-3 h-10 bg-gradient-to-t from-[#00BFA5] to-[#00E5CC] rounded-full shadow-lg"
                                                animate={{ scaleY: [0.3, 1, 0.3] }}
                                                transition={{
                                                    duration: 1,
                                                    repeat: Infinity,
                                                    delay: delay / 1000,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <p className="absolute bottom-2 text-[10px] font-medium text-white drop-shadow-lg">Listening...</p>
                                </motion.div>
                            )}
                        </div>

                        {/* Text Area */}
                        <div
                            className="p-3.5 space-y-3 max-h-52 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-950/50"
                            style={{
                                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)'
                            }}
                        >
                            {transcript && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-end"
                                >
                                    <div
                                        className="bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-2xl rounded-tr-md px-3.5 py-2 text-sm max-w-[80%]"
                                        style={{
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                        }}
                                    >
                                        {transcript}
                                    </div>
                                </motion.div>
                            )}
                            {response && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-start"
                                >
                                    <div
                                        className="bg-gradient-to-br from-[#00BFA5]/15 via-[#00E5CC]/10 to-[#00BFA5]/15 border border-[#00BFA5]/20 text-slate-800 dark:text-emerald-100 rounded-2xl rounded-tl-md px-3.5 py-2 text-sm max-w-[80%]"
                                        style={{
                                            boxShadow: '0 2px 8px rgba(0, 191, 165, 0.15), inset 0 1px 0 rgba(0, 229, 204, 0.1)'
                                        }}
                                    >
                                        {response}
                                    </div>
                                </motion.div>
                            )}
                            {!transcript && !response && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-8"
                                >
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00BFA5]/10 border border-[#00BFA5]/20">
                                        <Mic className="w-3 h-3 text-[#00BFA5]" />
                                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                                            Tap the mic to start
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Controls */}
                        <div
                            className="p-3.5 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-center gap-2 bg-white/50 dark:bg-slate-900/50"
                            style={{
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 -2px 4px rgba(0, 0, 0, 0.03)'
                            }}
                        >
                            {!isSpeaking ? (
                                <Button
                                    size="icon"
                                    className={`rounded-full w-10 h-10 transition-all duration-300 ${isListening
                                        ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 scale-105'
                                        : 'bg-gradient-to-br from-[#00BFA5] to-[#00E5CC] hover:from-[#00A896] hover:to-[#00BFA5] hover:scale-105'
                                        }`}
                                    style={{
                                        boxShadow: isListening
                                            ? '0 8px 20px rgba(239, 68, 68, 0.4), 0 3px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                            : '0 8px 20px rgba(0, 191, 165, 0.4), 0 3px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    }}
                                    onClick={startListening}
                                >
                                    <Mic className="w-4 h-4 text-white" />
                                </Button>
                            ) : (
                                <Button
                                    size="icon"
                                    className="rounded-full w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:scale-105"
                                    style={{
                                        boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4), 0 3px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    }}
                                    onClick={stopSpeaking}
                                >
                                    <StopCircle className="w-4 h-4 text-white" />
                                </Button>
                            )}
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                onClick={toggleOpen}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:via-red-700 hover:to-rose-700 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                style={{
                    boxShadow: '0 12px 35px rgba(239, 68, 68, 0.5), 0 6px 18px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
                    filter: 'drop-shadow(0 4px 12px rgba(239, 68, 68, 0.4))',
                    transform: 'translateZ(10px)'
                }}
            >
                {isOpen ? (
                    <X className="w-4 h-4 text-white" />
                ) : (
                    <svg
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))' }}
                    >
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                        <circle cx="6" cy="8" r="1.5" fill="currentColor" />
                        <circle cx="18" cy="8" r="1.5" fill="currentColor" />
                        <circle cx="6" cy="16" r="1.5" fill="currentColor" />
                        <circle cx="18" cy="16" r="1.5" fill="currentColor" />
                        <line x1="12" y1="10" x2="7.5" y2="8" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="12" y1="10" x2="16.5" y2="8" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="12" y1="14" x2="7.5" y2="16" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="12" y1="14" x2="16.5" y2="16" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                )}
            </Button>
        </div>
    );
}
