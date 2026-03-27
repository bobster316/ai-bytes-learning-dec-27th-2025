
import { Pinecone } from "@pinecone-database/pinecone";

const pineconeClient = process.env.PINECONE_API_KEY
    ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    : null;

export const pinecone = pineconeClient || {
    listIndexes: async () => ({ indexes: [] }),
    createIndex: async () => { },
    index: () => ({
        query: async () => ({ matches: [] }),
        upsert: async () => { },
    })
} as any;

// Create index (run once during setup)
// Create index (run once during setup)
export async function initializePineconeIndex() {
    if (!process.env.PINECONE_API_KEY) {
        console.warn("Pinecone API Key missing - skipping initialization");
        return null;
    }

    const indexName = "ai-bytes-courses";

    try {
        // Check if index exists
        const indexesList = await pinecone.listIndexes();
        const indexExists = indexesList.indexes?.some((idx: any) => idx.name === indexName);


        if (!indexExists) {
            console.log("Creating Pinecone index...");
            await pinecone.createIndex({
                name: indexName,
                dimension: 1024, // VoyageAI dimension
                metric: "cosine",
                spec: {
                    serverless: {
                        cloud: "aws",
                        region: "us-east-1",
                    },
                },
            });
            console.log("Index created successfully!");
        }

        return pinecone.index(indexName);
    } catch (error) {
        console.error("Pinecone initialization error:", error);
        return null; // Don't throw, just return null so app continues
    }
}
