export class AudioStreamer {
    private context: AudioContext;
    private nextStartTime: number = 0;
    private isPlaying: boolean = false;
    private audioQueue: Float32Array[] = [];
    private isProcessing: boolean = false;
    private sampleRate: number = 24000; // Gemini default output is 24kHz

    constructor(sampleRate: number = 24000) {
        this.sampleRate = sampleRate;
        this.context = new AudioContext({ sampleRate: this.sampleRate });
    }

    async addPCMChunk(base64Data: string) {
        try {
            const binaryString = window.atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const int16Data = new Int16Array(bytes.buffer);
            const float32Data = new Float32Array(int16Data.length);

            for (let i = 0; i < int16Data.length; i++) {
                float32Data[i] = int16Data[i] / 32768.0;
            }

            this.schedulePlayback(float32Data);
        } catch (error) {
            console.error("Error processing audio chunk:", error);
        }
    }

    private schedulePlayback(audioData: Float32Array) {
        if (this.context.state === 'closed') {
            return;
        }

        const buffer = this.context.createBuffer(1, audioData.length, this.sampleRate);
        buffer.copyToChannel(audioData, 0);

        try {
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.context.destination);

            const currentTime = this.context.currentTime;

            // Ensure we don't schedule in the past
            if (this.nextStartTime < currentTime) {
                this.nextStartTime = currentTime + 0.05; // Small buffer for robustness
            }

            source.start(this.nextStartTime);
            this.nextStartTime += buffer.duration;
        } catch (error) {
            console.warn("Could not start audio source, context might be closing:", error);
        }
    }

    stop() {
        if (this.context && this.context.state !== 'closed') {
            this.context.close().catch(console.error);
        }
        this.isPlaying = false;
        this.nextStartTime = 0;
    }

    resume() {
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }
}
