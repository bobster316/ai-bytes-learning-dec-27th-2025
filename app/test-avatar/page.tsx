"use client";

import React, { useState } from 'react';
import { GreenScreenVideo } from '@/components/ui/green-screen-video';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function TestAvatarPage() {
    const [videoId, setVideoId] = useState('fffcdaf5d4734400be72cebd6d4748d9'); // Default to latest test
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('idle');
    const [testAvatarId, setTestAvatarId] = useState('');
    const [testText, setTestText] = useState('Hello, checking the new avatar look.');

    // Function to check status of an existing job
    const checkStatus = async () => {
        if (!videoId) return;
        setStatus('checking');
        try {
            // We use the HeyGen API proxy or a direct check if we had one. 
            // For now, let's assume we can fetch the status via a server action or API route.
            // Since we don't have a public status route ready, let's simulate or asking the user to check via script?
            // BETTER: Use the existing /api/heygen/webhook logic or similar? 
            // We'll add a temporary API route check for this page.

            // For this UI, users might just want to PASTE the known URL if they have it, 
            // or we use the ID to check.

            // Let's rely on the user pasting a URL for verification if the ID check is complex 
            // without a backend route. BUT, we can make a simple route.
            const res = await fetch(`/api/test-video-status?id=${videoId}`);
            const data = await res.json();

            if (data.url) {
                setVideoUrl(data.url);
                setStatus('success');
            } else {
                setStatus(data.status || 'failed');
            }
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-4xl space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                    Avatar & Transparency Verification
                </h1>
                <p className="text-muted-foreground">
                    Use this tool to verify the "Green Screen + Logo Overlay" implementation.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* CHECKER CARD */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. Check Video Status</CardTitle>
                        <CardDescription>Enter a HeyGen Job ID to see the result.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Job ID</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={videoId}
                                    onChange={(e) => setVideoId(e.target.value)}
                                    placeholder="Enter Job ID..."
                                />
                                <Button onClick={checkStatus} disabled={status === 'checking'}>
                                    {status === 'checking' ? 'Checking...' : 'Check'}
                                </Button>
                            </div>
                        </div>

                        {status !== 'idle' && (
                            <div className="p-4 bg-muted rounded-md text-sm">
                                Status: <span className="font-mono font-bold">{status}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* PREVIEW CARD */}
                <Card className="md:row-span-2">
                    <CardHeader>
                        <CardTitle>Live Preview</CardTitle>
                        <CardDescription>
                            Renders using <code>GreenScreenVideo</code> (removes green, adds logo).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[300px] bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800">
                        {videoUrl ? (
                            <div className="w-full aspect-video relative">
                                <GreenScreenVideo
                                    src={videoUrl}
                                    className="w-full h-full"
                                    showLogo={true}
                                    autoPlay
                                    controls
                                    loop
                                />
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground p-8">
                                <p>No video loaded.</p>
                                <p className="text-xs mt-2 opacity-50">Load a video ID to see the magic.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* GENERATOR CARD (Manual Override) */}
                <Card>
                    <CardHeader>
                        <CardTitle>2. Test New Avatar</CardTitle>
                        <CardDescription>Manually paste a Talking Photo ID to generate a test.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>New Avatar ID (from HeyGen Labs)</Label>
                            <Input
                                value={testAvatarId}
                                onChange={(e) => setTestAvatarId(e.target.value)}
                                placeholder="Paste ID (e.g. 3848...)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Test Script</Label>
                            <Input
                                value={testText}
                                onChange={(e) => setTestText(e.target.value)}
                            />
                        </div>
                        <Button className="w-full" disabled>
                            Generate Test (Requires Backend Setup)
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            * Use the backend scripts for generation currently.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

