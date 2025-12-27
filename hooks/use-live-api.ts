import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioRecorder } from '@/lib/audio/audio-recorder';
import { AudioStreamer } from '@/lib/audio/audio-streamer';
import { LiveConfig, LiveSetupMessage, RealtimeInputMessage, ServerContentMessage } from '@/lib/types/gemini-live';
import { COMPANY_INFO, DIFFICULTY_LEVELS, COURSE_STRUCTURE, PRICING, PLATFORM_FEATURES, NAVIGATION_MAP, AI_TOPICS_EXPERTISE, EXAMPLE_ANALOGIES, CONVERSATION_STYLE } from '@/lib/constants/aria-knowledge';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''; // Ensure this is set in .env.local

export function useLiveAPI() {
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [volume, setVolume] = useState(0); // For visualizer

    const wsRef = useRef<WebSocket | null>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const streamerRef = useRef<AudioStreamer | null>(null);

    // Initialize Audio Components
    useEffect(() => {
        recorderRef.current = new AudioRecorder();
        streamerRef.current = new AudioStreamer(24000); // Gemini output is 24kHz

        // Handle incoming microphone data
        recorderRef.current.on('data', (base64Data: string) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                const message: RealtimeInputMessage = {
                    realtimeInput: {
                        mediaChunks: [{
                            mimeType: "audio/pcm;rate=16000",
                            data: base64Data
                        }]
                    }
                };
                wsRef.current.send(JSON.stringify(message));

                // Simulate volume for visualizer (very rough approx)
                setVolume(Math.random() * 0.5 + 0.1);
            }
        });

        return () => {
            recorderRef.current?.stop();
            streamerRef.current?.stop();
        };
    }, []);

    const connect = useCallback(async () => {
        if (!GEMINI_API_KEY) {
            console.error("Gemini API Key missing");
            return;
        }

        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("Connected to Gemini Live API");
            setIsConnected(true);

            // Construct System Instruction
            const systemInstructionText = `
            You are Aria, the AI voice assistant for ${COMPANY_INFO.name}.
            
            MISSION: ${COMPANY_INFO.mission}
            
            STYLE: You are a British AI Assistant.
            Speak with a crisp, clear Southern British accent (Received Pronunciation).
            Do NOT sound American. Enunciate clearly.
            Use British spelling and phrasing (e.g. 'colour', 'optimise').
            Keep responses ${CONVERSATION_STYLE.length}.
            
            PLATFORM INFO:
            - Pricing: ${PRICING.premium} per premium course. ${PRICING.free}.
            - Structure: ${COURSE_STRUCTURE.totalDuration}, ${COURSE_STRUCTURE.topics}.
            
            EXPERTISE: You are an expert in ${AI_TOPICS_EXPERTISE.join(', ')}.
            
            FOR BEGINNERS: Use analogies like: "${EXAMPLE_ANALOGIES.neuralNetworks}"
            
            NAVIGATION:
            - Homepage: ${NAVIGATION_MAP["/"]}
            - Courses: ${NAVIGATION_MAP["/courses"]}
            
            IMPORTANT: You are a VOICE assistant. Be concise, engaging, and conversational. Do not use markdown formatting in your speech.
            `;

            // Send Setup Message
            const setupMessage: LiveSetupMessage = {
                setup: {
                    model: "models/gemini-2.0-flash-exp",
                    generationConfig: {
                        responseModalities: "audio",
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } // Kore adapts better to British RP
                        }
                    },
                    systemInstruction: {
                        parts: [{ text: systemInstructionText }]
                    }
                }
            };
            ws.send(JSON.stringify(setupMessage));

            // Send initial trigger for greeting
            const clientContentMsg = {
                clientContent: {
                    turns: [{
                        role: "user",
                        parts: [{ text: "Hello Aria, please introduce yourself briefly." }]
                    }],
                    turnComplete: true
                }
            };
            ws.send(JSON.stringify(clientContentMsg));

            // Start recording automatically
            recorderRef.current?.start();
            setIsListening(true);
            streamerRef.current?.resume();
        };

        ws.onmessage = async (event) => {
            try {
                let data;
                if (event.data instanceof Blob) {
                    data = JSON.parse(await event.data.text());
                } else {
                    data = JSON.parse(event.data);
                }

                const serverContent = data as ServerContentMessage;

                // Handle Audio
                if (serverContent.serverContent?.modelTurn?.parts) {
                    for (const part of serverContent.serverContent.modelTurn.parts) {
                        if (part.inlineData && part.inlineData.mimeType.startsWith("audio/pcm")) {
                            streamerRef.current?.addPCMChunk(part.inlineData.data);
                        }
                    }
                }

                // Handle Turn Complete / Interruption
                if (serverContent.serverContent?.turnComplete) {
                    // AI finished talking
                }

                if (serverContent.serverContent?.interrupted) {
                    // AI was interrupted
                    // Clear audio queue if possible (streamer implementation simple for now)
                    console.log("AI Interrupted");
                }

            } catch (e) {
                console.error("Error parsing message", e);
            }
        };

        ws.onclose = () => {
            console.log("Disconnected from Gemini Live API");
            setIsConnected(false);
            setIsListening(false);
            recorderRef.current?.stop();
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error", error);
        };

    }, []);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        recorderRef.current?.stop();
        streamerRef.current?.stop();
        setIsConnected(false);
        setIsListening(false);
    }, []);

    const toggleMute = useCallback(() => {
        // Implement muting logic if needed for recorder
        // For now just stop recording? Or logic to block data sending
    }, []);

    return {
        isConnected,
        isListening,
        connect,
        disconnect,
        volume
    };
}
