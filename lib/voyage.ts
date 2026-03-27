
import { VoyageAIClient } from "voyageai";

export const voyage = new VoyageAIClient({
    apiKey: process.env.VOYAGE_API_KEY!,
});

export async function generateEmbedding(
    text: string,
    inputType: "query" | "document" = "document"
): Promise<number[]> {
    const response = await voyage.embed({
        input: [text],
        model: "voyage-2",
        inputType,
    });

    return (response as any).embeddings[0];
}

export async function generateEmbeddings(
    texts: string[],
    inputType: "query" | "document" = "document"
): Promise<number[][]> {
    // Batch process (VoyageAI allows up to 128 texts)
    const batchSize = 128;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const response = await voyage.embed({
            input: batch,
            model: "voyage-2",
            inputType,
        });
        allEmbeddings.push(...(response as any).embeddings);
    }

    return allEmbeddings;
}
