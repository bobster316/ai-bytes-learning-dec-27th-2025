"use client";
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
});

interface MermaidChartProps {
    chart: string;
}

export const MermaidChart: React.FC<MermaidChartProps> = ({ chart }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = React.useState<string>('');

    useEffect(() => {
        if (chart && ref.current) {
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            mermaid.render(id, chart).then(({ svg }) => {
                setSvg(svg);
            }).catch((err) => {
                console.error('Mermaid rendering failed:', err);
                setSvg(`<div class="text-red-500 text-xs p-2">Failed to render diagram</div>`);
            });
        }
    }, [chart]);

    return (
        <div
            ref={ref}
            className="mermaid-container w-full flex justify-center p-4 bg-white/5 rounded-xl overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};
