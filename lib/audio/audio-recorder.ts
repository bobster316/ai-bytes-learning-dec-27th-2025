import { EventEmitter } from 'events';

export class AudioRecorder extends EventEmitter {
    private context: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private isRecording: boolean = false;
    private sampleRate: number = 16000; // Target sample rate for Gemini

    constructor() {
        super();
    }

    async start() {
        if (this.isRecording) return;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: this.sampleRate
                }
            });

            this.context = new AudioContext({ sampleRate: this.sampleRate });
            await this.context.audioWorklet.addModule('/audio-worklet-processor.js');

            this.source = this.context.createMediaStreamSource(this.stream);
            this.workletNode = new AudioWorkletNode(this.context, 'pcm-processor');

            this.workletNode.port.onmessage = (event) => {
                const inputBuffer = event.data as Float32Array;
                this.processAudio(inputBuffer);
            };

            this.source.connect(this.workletNode);
            this.workletNode.connect(this.context.destination); // Keep alive

            this.isRecording = true;
            this.emit('start');
        } catch (error) {
            console.error('Error starting audio recorder:', error);
            this.emit('error', error);
        }
    }

    stop() {
        if (!this.isRecording) return;

        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }

        if (this.workletNode) {
            this.workletNode.disconnect();
            this.workletNode = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.context) {
            this.context.close();
            this.context = null;
        }

        this.isRecording = false;
        this.emit('stop');
    }

    private processAudio(inputData: Float32Array) {
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to Base64
        const base64 = this.arrayBufferToBase64(pcmData.buffer);
        this.emit('data', base64);
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
}
