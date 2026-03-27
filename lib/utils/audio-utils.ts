/**
 * Converts raw PCM data (16-bit, 24kHz, mono) to a valid WAV buffer.
 * Gemini TTS output format is specifically 16-bit PCM at 24000Hz.
 */
export function pcmToWav(pcmData: Buffer): Buffer {
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;

    const header = Buffer.alloc(44);

    // RIFF identifier
    header.write("RIFF", 0);
    // File size (data size + header size - 8)
    header.writeUInt32LE(pcmData.length + 36, 4);
    // WAVE identifier
    header.write("WAVE", 8);

    // fmt chunk identifier
    header.write("fmt ", 12);
    // Format chunk length
    header.writeUInt32LE(16, 16);
    // Sample format (1 is PCM)
    header.writeUInt16LE(1, 20);
    // Number of channels
    header.writeUInt16LE(numChannels, 22);
    // Sample rate
    header.writeUInt32LE(sampleRate, 24);
    // Byte rate (sampleRate * numChannels * bitsPerSample / 8)
    header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    // Block align (numChannels * bitsPerSample / 8)
    header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    // Bits per sample
    header.writeUInt16LE(bitsPerSample, 34);

    // data chunk identifier
    header.write("data", 36);
    // Data size
    header.writeUInt32LE(pcmData.length, 40);

    return Buffer.concat([header, pcmData]);
}
