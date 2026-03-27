
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

function pcmToWav(pcmData) {
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(pcmData.length + 36, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write("data", 36);
    header.writeUInt32LE(pcmData.length, 40);
    return Buffer.concat([header, pcmData]);
}

async function runTest() {
    const supabaseUrl = 'https://aysqedgkpdbcbubadrrr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c3FlZGdrcGRiY2J1YmFkcnJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUzOTc5MCwiZXhwIjoyMDc4MTE1NzkwfQ.TLTdqATsMYiSRZM1HziWZ9wYNsPRvfCrYmjg9roP5RM';
    const geminiKey = 'AIzaSyBb22WsVeNtG_oL1U4S4Fy12dTbZL5w2PE';

    const lessonId = 3408;
    const courseId = 732;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const genAI = new GoogleGenerativeAI(geminiKey);
    const lessonBrief = "What is Generative AI? This lesson covers the basics of AI models that create new content.";

    try {
        console.log("Calling Gemini TTS...");
        const audioModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

        const audioResult = await audioModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: `Vocalize the following multi-speaker podcast script as a high-fidelity audio overview.\n\nLESSON BRIEF:\n${lessonBrief}` }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        multiSpeakerVoiceConfig: {
                            speakerVoiceConfigs: [
                                { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Sadaltager" } }, speakerId: "Host A" },
                                { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }, speakerId: "Host B" }
                            ]
                        }
                    }
                }
            }
        });

        const audioResponse = await audioResult.response;
        const audioPart = audioResponse.candidates[0].content.parts.find((p) => p.inlineData?.mimeType?.startsWith('audio/'));

        if (audioPart?.inlineData?.data) {
            console.log("Audio data received. Uploading...");
            const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
            const audioBuffer = pcmToWav(pcmBuffer);
            const fileName = `lessons/${courseId}/${lessonId}/test_multispeaker.wav`;

            const { error: uploadErr } = await supabase.storage
                .from('course-assets')
                .upload(fileName, audioBuffer, { contentType: 'audio/wav', upsert: true });

            if (uploadErr) throw uploadErr;
            const { data: { publicUrl } } = supabase.storage.from('course-assets').getPublicUrl(fileName);
            console.log("✅ SUCCESS! Public URL:", publicUrl);
        } else {
            console.log("❌ FAILED: No audio parts.");
        }
    } catch (e) {
        console.error("❌ ERROR during generation:");
        console.error(JSON.stringify(e, null, 2));
        if (e.response && e.response.error) {
            console.error("errorDetails:", JSON.stringify(e.response.error, null, 2));
        }
    }
}

runTest();
