"use client";

import { useState, useRef, useEffect } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { Mic, Square, Volume2, Activity, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

const SYSTEM_INSTRUCTION = `You are a helpful AI assistant.`;

export function SterlingDiagnostic() {
    // --- State ---
    const [status, setStatus] = useState("IDLE");
    const [volume, setVolume] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [useCompatMode, setUseCompatMode] = useState(false); // New Toggle
    const [audioState, setAudioState] = useState("inactive"); // Debug context state
    const [isSpeaking, setIsSpeaking] = useState(false); // VAD state
    const fixedVoice = "Aoede"; // Fixed voice for diagnostic only (no picker)

    // --- Refs ---
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sessionRef = useRef<any>(null);

    // --- Logger ---
    const log = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 50)]);
    };

    // --- Init Devices ---
    useEffect(() => {
        const init = async () => {
            try {
                // Force permission request
                await navigator.mediaDevices.getUserMedia({ audio: true });
                const devs = await navigator.mediaDevices.enumerateDevices();
                const mics = devs.filter(d => d.kind === 'audioinput');
                setDevices(mics);
                log(`Found ${mics.length} microphones.`);
                if (mics.length > 0) setSelectedDeviceId(mics[0].deviceId);
            } catch (e: any) {
                log(`❌ Permission Error: ${e.message}`);
            }
        };
        init();
    }, []);

    // --- Test Speaker Function ---
    const playTestSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 440; // A4
            gain.gain.value = 0.1;
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
            log("🔊 Playing Test Sound...");
        } catch (e: any) {
            log(`❌ Speaker Error: ${e.message}`);
        }
    };

    // --- Start Sterling Session ---
    const connect = async () => {
        try {
            setStatus("STARTING");
            log("--- NEW SESSION ---");

            // 1. Setup Audio Context
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (ctx.state === 'suspended') await ctx.resume();
            audioContextRef.current = ctx;
            nextPlayTimeRef.current = 0; // Reset scheduler
            setAudioState(ctx.state);

            // Monitor state changes
            ctx.onstatechange = () => {
                setAudioState(ctx.state);
                log(`AudioContext State changed to: ${ctx.state}`);
            };
            log(`AudioContext Active (${ctx.sampleRate}Hz)`);

            // 2. Get Mic Stream
            const constraints = {
                audio: {
                    echoCancellation: true,  // Always enable to prevent feedback loop
                    noiseSuppression: true,  // Always enable to reduce background noise
                    autoGainControl: true,   // Always enable for consistent volume
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
                }
            };
            log(`Requesting Mic [Echo Cancellation: ON]...`);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            mediaStreamRef.current = stream;

            // Debug Track info
            const track = stream.getAudioTracks()[0];
            log(`✅ Mic Acquired: ${track.label} (Muted: ${track.muted})`);
            track.onmute = () => log("⚠️ Track Muted by System (Permission/Hardware)");
            track.onunmute = () => log("✅ Track Unmuted");

            // 3. Connect API
            const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
            log("Connecting to Gemini...");

            const session = await ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: fixedVoice } }
                    },
                    systemInstruction: {
                        parts: [{
                            text: "You are Sterling, an AI assistant."
                        }]
                    }
                },
                callbacks: {
                    onopen: () => {
                        setStatus("CONNECTED");
                        log("✅ Gemini WebSocket OPEN");
                        // Greet
                        setTimeout(() => {
                            session.sendClientContent({
                                turns: [{ parts: [{ text: "Hello" }], role: "user" }],
                                turnComplete: true
                            });
                            log("Sent text greeting: 'Hello'");
                        }, 500);
                    },
                    onclose: () => {
                        setStatus("DISCONNECTED");
                        log("⚠️ Gemini Socket Closed");
                        cleanup();
                    },
                    onerror: (e: any) => {
                        log(`❌ Gemini Error: ${e.message}`);
                    },
                    onmessage: (msg: any) => {
                        // Check for audio
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            log("🟣 Received Audio Chunk from Gemini");
                            playAudio(audioData, ctx);
                        }
                        // Check for text turn complete
                        if (msg.serverContent?.turnComplete) {
                            log("✅ Turn Complete");
                        }
                    }
                }
            });
            sessionRef.current = session;

            // 4. Input Processor (Volume + Send)
            const source = ctx.createMediaStreamSource(stream);

            // Add 2x gain boost (reduced since auto gain control is now enabled)
            const gainNode = ctx.createGain();
            gainNode.gain.value = 2.0; // 2x amplification
            log("🔊 Applied 2x gain boost (auto gain control enabled)");

            const processor = ctx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                const input = e.inputBuffer.getChannelData(0);

                // Volume Meter
                let sum = 0;
                for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
                const rms = Math.sqrt(sum / input.length);
                setVolume(rms);

                // Simple indicator: show "listening" when connected
                setIsSpeaking(sessionRef.current !== null);

                // Send all audio to API - let Gemini handle VAD server-side
                if (sessionRef.current) {
                    try {
                        const ratio = ctx.sampleRate / 16000;
                        const newLen = Math.floor(input.length / ratio);
                        const pcm16 = new Int16Array(newLen);
                        for (let i = 0; i < newLen; i++) {
                            const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)]));
                            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                        }
                        const binary = String.fromCharCode(...new Uint8Array(pcm16.buffer));

                        // CRITICAL FIX: Use correct API format with 'audio' property
                        sessionRef.current.sendRealtimeInput({
                            audio: {
                                data: btoa(binary),
                                mimeType: "audio/pcm;rate=16000"
                            }
                        });
                        console.log(`📤 Sent audio to API (${newLen} samples, RMS: ${rms.toFixed(4)})`);
                    } catch (err: any) {
                        console.error("❌ Error sending audio:", err.message);
                    }
                }
            };

            source.connect(gainNode);
            gainNode.connect(processor);
            processor.connect(ctx.destination);

        } catch (e: any) {
            log(`❌ Setup Error: ${e.message}`);
            cleanup();
        }
    };

    const nextPlayTimeRef = useRef(0);

    const playAudio = (base64Data: string, ctx: AudioContext) => {
        try {
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            const int16 = new Int16Array(bytes.buffer);
            const float32 = new Float32Array(int16.length);
            for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

            const buffer = ctx.createBuffer(1, float32.length, 24000);
            buffer.copyToChannel(float32, 0);

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);

            // Scheduling
            const now = ctx.currentTime;
            // If next time is in the past (gap in speech), reset to now
            const startTime = Math.max(now, nextPlayTimeRef.current);
            source.start(startTime);
            nextPlayTimeRef.current = startTime + buffer.duration;

            log(`🔊 Playing audio (${float32.length} samples, ${buffer.duration.toFixed(2)}s)`);
        } catch (e: any) {
            log(`❌ Audio playback error: ${e.message}`);
        }
    };

    const cleanup = () => {
        if (sessionRef.current) sessionRef.current.close();
        if (processorRef.current) processorRef.current.disconnect();
        if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }

        sessionRef.current = null;
        setStatus("IDLE");
        setVolume(0);
        setIsSpeaking(false);
        log("Disconnected");
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 w-96 bg-black border border-gray-800 rounded-lg shadow-2xl overflow-hidden font-mono text-xs">
            {/* Header */}
            <div className="bg-gray-900 p-2 flex justify-between items-center border-b border-gray-800">
                <div className="flex items-center gap-2 text-white font-bold">
                    <Terminal size={14} className="text-green-500" />
                    STERLING DIAGNOSTIC
                </div>
                <div className={`px-2 py-0.5 rounded ${status === 'CONNECTED' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {status}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* 1. Device Selection & Compat Mode */}
                <div className="space-y-1">
                    <label className="text-gray-500 uppercase font-bold text-[10px]">Input Device</label>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 bg-gray-900 border border-gray-700 text-gray-300 p-1 rounded"
                            value={selectedDeviceId}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                        >
                            {devices.map((d, i) => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label || `Mic ${i + 1}`}
                                </option>
                            ))}
                        </select>
                        <Button
                            variant={useCompatMode ? "default" : "outline"}
                            size="sm"
                            className={`text-[8px] h-full ${useCompatMode ? 'bg-blue-600' : 'border-gray-700 text-gray-400'}`}
                            onClick={() => setUseCompatMode(!useCompatMode)}
                            title="Toggle Compatibility Mode (Echo Cancellation ON)"
                        >
                            {useCompatMode ? 'COMPAT ON' : 'RAW MODE'}
                        </Button>
                    </div>
                </div>


                {/* 2. Audio Level Meter */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                        <span>Mic Input Level</span>
                        <div className="flex gap-2">
                            <span className={audioState === 'running' ? 'text-green-500' : 'text-red-500'}>
                                {audioState.toUpperCase()}
                            </span>
                            {isSpeaking && <span className="text-[#00FFB3] animate-pulse">🎙️ LISTENING</span>}
                            <span>Peak: {(volume).toFixed(3)}</span>
                        </div>
                    </div>
                    <div className="h-4 bg-gray-900 rounded overflow-hidden relative border border-gray-700">
                        <div
                            className="absolute top-0 bottom-0 left-0 bg-green-500 transition-all duration-75 ease-out"
                            style={{ width: `${Math.min(100, volume * 100)}%` }}
                        />
                        <div className="absolute top-0 bottom-0 left-[10%] w-0.5 bg-yellow-500/50" title="Silence Threshold" />
                    </div>
                    <p className="text-[9px] text-gray-600">
                        *Green bar should move when you speak. If stuck at 0%, try different mic or toggle COMPAT MODE.*
                    </p>
                </div>

                {/* 3. Controls */}
                <div className="flex gap-2">
                    <Button
                        onClick={status === 'CONNECTED' ? cleanup : connect}
                        className={`flex-1 ${status === 'CONNECTED' ? 'bg-red-900 hover:bg-red-800' : 'bg-green-900 hover:bg-green-800'}`}
                    >
                        {status === 'CONNECTED' ? 'DISCONNECT' : 'CONNECT API'}
                    </Button>
                    <Button variant="outline" size="icon" onClick={playTestSound} title="Test Speakers">
                        <Volume2 size={16} className="text-[#00FFB3]" />
                    </Button>
                </div>

                {/* 4. Logs */}
                <div className="h-48 bg-gray-950 rounded border border-gray-800 p-2 overflow-y-auto font-mono text-[10px] space-y-1">
                    {logs.length === 0 && <span className="text-gray-700 italic">No logs yet...</span>}
                    {logs.map((l, i) => (
                        <div key={i} className={`
                            ${l.includes('❌') ? 'text-red-400' : ''}
                            ${l.includes('✅') ? 'text-green-400' : ''}
                            ${l.includes('🟣') ? 'text-purple-400' : ''}
                            ${!l.match(/[❌✅🟣]/) ? 'text-gray-400' : ''}
                        `}>
                            {l}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
