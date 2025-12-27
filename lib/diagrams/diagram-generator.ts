
import { v4 as uuidv4 } from 'uuid';

export type DiagramType = 'neural-network' | 'flowchart' | 'chart' | 'concept-map';

interface DiagramConfig {
    title: string;
    colors?: string[];
    data?: any;
}

export class DiagramGenerator {

    /**
     * Main entry point to generate a diagram SVG string.
     */
    async generate(type: DiagramType, config: DiagramConfig): Promise<string> {
        switch (type) {
            case 'neural-network':
                return this.generateNeuralNetwork(config);
            case 'flowchart':
                // Placeholder for Mermaid implementation
                return this.generatePlaceholder(config.title, 'Flowchart coming soon');
            default:
                return this.generatePlaceholder(config.title, 'Diagram type not implemented');
        }
    }

    /**
     * Generates a sleek, dark-mode Neural Network visualization.
     */
    private generateNeuralNetwork(config: DiagramConfig): string {
        const width = 1200;
        const height = 800;
        const layers = config.data?.layers || [4, 6, 6, 4, 2]; // Default topology

        // Calculate geometry
        const maxNodes = Math.max(...layers);
        const layerSpacing = (width - 200) / (layers.length - 1);
        const nodeSpacing = (height - 200) / maxNodes;

        let svgContent = '';
        let connections = '';
        let nodes = '';

        // Prepare colors
        const colors = config.colors || ['#22d3ee', '#818cf8', '#a78bfa', '#f472b6'];

        // Generate Nodes and Connections
        layers.forEach((nodeCount: number, layerIndex: number) => {
            const x = 100 + layerIndex * layerSpacing;
            const currentLayerNodes = [];
            const layerColor = colors[layerIndex % colors.length];

            // Center nodes vertically
            const startY = (height - (nodeCount * nodeSpacing)) / 2 + (nodeSpacing / 2);

            for (let i = 0; i < nodeCount; i++) {
                const y = startY + i * nodeSpacing;
                currentLayerNodes.push({ x, y });

                // Nodes
                nodes += `
                    <g class="node-group" opacity="0" transform="translate(0, 50)">
                        <circle cx="${x}" cy="${y}" r="8" fill="#0f172a" stroke="${layerColor}" stroke-width="3" />
                        <circle cx="${x}" cy="${y}" r="4" fill="${layerColor}">
                            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" begin="${Math.random()}s"/>
                        </circle>
                        <animateTransform attributeName="transform" type="translate" to="0,0" dur="0.8s" fill="freeze" begin="${layerIndex * 0.2}s" calcMode="spline" keySplines="0.4 0 0.2 1"/>
                        <animate attributeName="opacity" to="1" dur="0.8s" fill="freeze" begin="${layerIndex * 0.2}s"/>
                    </g>
                `;
            }

            // Connections to previous layer
            if (layerIndex > 0) {
                const prevLayerCount = layers[layerIndex - 1];
                const prevLayerX = 100 + (layerIndex - 1) * layerSpacing;
                const prevStartY = (height - (prevLayerCount * nodeSpacing)) / 2 + (nodeSpacing / 2);

                for (let i = 0; i < nodeCount; i++) {
                    const y = startY + i * nodeSpacing;

                    for (let j = 0; j < prevLayerCount; j++) {
                        const prevY = prevStartY + j * nodeSpacing;
                        // Randomly prune some connections for cleaner look if dense
                        if (Math.random() > 0.3 || layers.length < 5) {
                            connections += `
                                <path d="M ${prevLayerX} ${prevY} C ${prevLayerX + layerSpacing * 0.5} ${prevY}, ${x - layerSpacing * 0.5} ${y}, ${x} ${y}" 
                                      stroke="${layerColor}" stroke-width="1" opacity="0.15" fill="none">
                                      <animate attributeName="stroke-dasharray" from="0, 1000" to="1000, 0" dur="2s" fill="freeze" begin="${layerIndex * 0.15}s"/>
                                </path>
                            `;
                        }
                    }
                }
            }
        });

        return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background: #0f172a; border-radius: 12px;">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            <!-- Grid Background -->
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <!-- Title -->
            <text x="${width / 2}" y="60" text-anchor="middle" font-family="'Inter', sans-serif" font-size="32" fill="white" font-weight="bold" letter-spacing="-1">
                ${config.title}
            </text>
            <text x="${width / 2}" y="100" text-anchor="middle" font-family="'Inter', sans-serif" font-size="16" fill="#94a3b8">
                Neural Architecture Visualization
            </text>

            <!-- Diagram Content -->
            <g filter="url(#glow)">
                ${connections}
                ${nodes}
            </g>

            <!-- Metadata Footer -->
            <text x="40" y="${height - 40}" font-family="monospace" font-size="12" fill="#475569">
                Generated by AI Bytes Engine • Layers: [${layers.join(', ')}]
            </text>
        </svg>
        `.trim();
    }

    private generatePlaceholder(title: string, subtitle: string): string {
        // ... reused simple fallback logic if needed
        return ``;
    }
}

// Singleton export
export const diagramGenerator = new DiagramGenerator();
