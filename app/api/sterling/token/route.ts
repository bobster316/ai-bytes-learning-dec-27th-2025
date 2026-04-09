import { NextResponse } from "next/server";

declare global {
    var activeSterlingUser: string | undefined;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    if (name) global.activeSterlingUser = name;

    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!agentId || !apiKey) {
      return NextResponse.json({ error: "Missing configuration" }, { status: 500 });
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`, {
      headers: { "xi-api-key": apiKey },
      cache: "no-store"
    });

    if (!res.ok) {
        console.error("ElevenLabs Token Error:", await res.text());
        return NextResponse.json({ error: "Failed to get signed URL" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (e) {
    console.error("Failed to fetch token", e);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
