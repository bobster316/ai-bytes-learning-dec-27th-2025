export type LiveConfig = {
    model: string;
    systemInstruction?: { parts: { text: string }[] };
    generationConfig?: {
        responseModalities?: "audio" | "image" | "text";
        speechConfig?: {
            voiceConfig?: { prebuiltVoiceConfig?: { voiceName: string } };
        };
    };
};

export type LiveSetupMessage = {
    setup: LiveConfig;
};

export type RealtimeInputMessage = {
    realtimeInput: {
        mediaChunks: {
            mimeType: string;
            data: string;
        }[];
    };
};

export type ServerContentMessage = {
    serverContent: {
        modelTurn?: {
            parts: {
                text?: string;
                inlineData?: {
                    mimeType: string;
                    data: string;
                };
            }[];
        };
        turnComplete?: boolean;
        interrupted?: boolean;
    };
};
