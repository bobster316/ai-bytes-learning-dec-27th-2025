
"use client";

import React, { useEffect, useRef, useState } from 'react';

export function NeuralCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [speed, setSpeed] = useState(50);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas to full screen/container
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        let animationFrameId: number;

        // --- Spiking Neural Network Configuration ---

        // 1. Structure
        // Distribute layers across the width
        const layerCount = 6;
        const layers = [];
        for (let i = 0; i < layerCount; i++) {
            layers.push({
                id: i,
                xPercent: 0.1 + (i * (0.8 / (layerCount - 1))), // 10% to 90%
                nodes: i === 0 || i === layerCount - 1 ? 6 : 10, // More nodes in middle
                color: ['#8b5cf6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#A855F7'][i % 6]
            });
        }

        // 2. Node & Connection Types
        interface Node {
            x: number;
            y: number;
            layerId: number;
            color: string;
            idx: number;
            potential: number;
            threshold: number;
            decay: number;
            flash: number;
        }

        interface Connection {
            from: number;
            to: number;
            weight: number;
        }

        interface Signal {
            fromNode: number;
            toNode: number;
            progress: number;
            speed: number;
            color: string;
            strength: number;
        }

        // 3. Initialization
        let networkNodes: Node[] = [];
        let nodeIdxCounter = 0;
        let connections: Connection[] = [];
        const signals: Signal[] = [];

        function initNetwork() {
            networkNodes = [];
            nodeIdxCounter = 0;
            connections = [];

            if (!canvas) return;

            layers.forEach(layer => {
                const layerX = layer.xPercent * canvas.width;
                const spacingY = canvas.height / (layer.nodes + 1);
                for (let i = 0; i < layer.nodes; i++) {
                    networkNodes.push({
                        x: layerX,
                        y: spacingY * (i + 1),
                        layerId: layer.id,
                        color: layer.color,
                        idx: nodeIdxCounter++,
                        potential: 0,
                        threshold: 1.0,
                        decay: 0.02,
                        flash: 0
                    });
                }
            });

            for (let i = 0; i < networkNodes.length; i++) {
                const source = networkNodes[i];
                for (let j = 0; j < networkNodes.length; j++) {
                    const target = networkNodes[j];
                    if (target.layerId === source.layerId + 1) {
                        // Connect to next layer
                        const weight = Math.random() > 0.2 ? Math.random() * 0.5 + 0.1 : -0.1;
                        connections.push({ from: i, to: j, weight });
                    }
                }
            }
        }

        // Re-init on resize to fix positions
        initNetwork();

        // Animation Loop
        const render = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // --- A. Simulation Logic ---

            // 1. Input Layer Stimulation
            const inputExcitementChance = 0.05;
            const inputLayerNodes = networkNodes.filter(n => n.layerId === 0);
            inputLayerNodes.forEach(node => {
                if (Math.random() < inputExcitementChance) {
                    node.potential += 0.3;
                }
            });

            // 2. Node Dynamics
            networkNodes.forEach(node => {
                node.potential *= (1 - node.decay);
                if (node.potential < 0) node.potential = 0;
                node.flash *= 0.9;

                if (node.potential >= node.threshold) {
                    node.flash = 1.0;
                    node.potential = 0;
                    const outgoing = connections.filter(c => c.from === node.idx);
                    outgoing.forEach(conn => {
                        signals.push({
                            fromNode: conn.from,
                            toNode: conn.to,
                            progress: 0,
                            speed: 0.02,
                            color: node.color,
                            strength: 1.0 * conn.weight
                        });
                    });
                }
            });

            // 3. Signal Dynamics
            for (let i = signals.length - 1; i >= 0; i--) {
                const sig = signals[i];
                sig.progress += sig.speed;
                if (sig.progress >= 1) {
                    const targetNode = networkNodes[sig.toNode];
                    if (targetNode) targetNode.potential += sig.strength;
                    signals.splice(i, 1);
                }
            }

            // --- B. Drawing ---

            // 1. Connections
            ctx.lineWidth = 1;
            connections.forEach(conn => {
                const start = networkNodes[conn.from];
                const end = networkNodes[conn.to];
                if (start && end) {
                    ctx.beginPath();
                    ctx.moveTo(start.x, start.y);
                    ctx.lineTo(end.x, end.y);
                    ctx.strokeStyle = start.color + '20'; // Very faint
                    ctx.stroke();
                }
            });

            // 2. Signals
            signals.forEach(sig => {
                const start = networkNodes[sig.fromNode];
                const end = networkNodes[sig.toNode];
                if (start && end) {
                    const lx = start.x + (end.x - start.x) * sig.progress;
                    const ly = start.y + (end.y - start.y) * sig.progress;
                    ctx.fillStyle = sig.color;
                    ctx.beginPath();
                    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // 3. Nodes
            networkNodes.forEach(node => {
                if (node.flash > 0.01) {
                    ctx.fillStyle = node.color;
                    ctx.globalAlpha = node.flash;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }

                ctx.fillStyle = node.color + '40';
                ctx.beginPath();
                ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initNetwork();
        };

        window.addEventListener('resize', handleResize);

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('resize', resize);
        };

    }, [speed]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
        />
    );
}

export default NeuralCanvas;
