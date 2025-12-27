"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float, Stars } from "@react-three/drei";

function ParticleSwarm({ progress }: { progress: number }) {
    const mesh = useRef<THREE.Points>(null!);
    const lightRef = useRef<THREE.PointLight>(null!);

    // Lerped progress for smooth animation
    const currentProgress = useRef(0);

    const count = 4000;

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            // Spherical distribution base
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);

            temp.push({
                x, y, z,
                // Each particle has unique motion parameters
                speed: 0.2 + Math.random() * 0.5,
                orbitRadius: 2 + Math.random() * 3,
                randomOffset: Math.random() * 100
            });
        }
        return temp;
    }, [count]);

    useFrame((state, delta) => {
        if (!mesh.current) return;

        // 1. SMOOTHING: Lerp currentProgress towards target 'progress'
        // effectively checking the difference and closing it by 5% per frame
        currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, progress, delta * 2);

        const t = state.clock.getElapsedTime();
        const prog = currentProgress.current; // 0 to 100

        // Rotation
        mesh.current.rotation.y = t * 0.1;
        mesh.current.rotation.z = t * 0.05;

        // Color Logic
        const hue = (0.5 + (prog / 100) * 0.2) % 1; // Cyan (0.5) to Purple (0.7)
        const lightColor = new THREE.Color().setHSL(hue, 0.8, 0.6);

        if (lightRef.current) {
            lightRef.current.color = lightColor;
            lightRef.current.intensity = 1 + (prog / 100) * 2;
        }

        // Particle Update Loop
        const positions = mesh.current.geometry.attributes.position.array as Float32Array;

        particles.forEach((p, i) => {
            let px, py, pz;

            // ANIMATION PHASES

            // Phase 1: Chaos/Swarm (0-30%)
            // Particles move noisily
            const phase1 = Math.max(0, 1 - (prog / 30));

            // Phase 2: Orbit/Ring (30-60%)
            // Particles flatten into a disc/rings
            const phase2 = Math.max(0, 1 - Math.abs(prog - 45) / 20);

            // Phase 3: Structure/Sphere (60-100%)
            // Particles lock into the perfect sphere shape
            const phase3 = Math.max(0, (prog - 60) / 40);

            // Calculate Base Positions

            // Chaos motion
            const noise = Math.sin(t * p.speed + p.randomOffset);
            const chaosX = p.x * (p.orbitRadius + noise);
            const chaosY = p.y * (p.orbitRadius + noise);
            const chaosZ = p.z * (p.orbitRadius + noise);

            // Ring motion (flatten Y, expand X/Z)
            const ringX = p.x * (p.orbitRadius * 2);
            const ringY = p.y * 0.2 + Math.sin(t * 2 + p.x) * 0.5;
            const ringZ = p.z * (p.orbitRadius * 2);

            // Sphere structure
            const sphereScale = 4 + (prog / 100) * 2; // Grows slightly
            const sphereX = p.x * sphereScale;
            const sphereY = p.y * sphereScale;
            const sphereZ = p.z * sphereScale;

            // Blend phases
            // This is a rough blending logic: predominately logic A if phase A is high
            // We'll just interpolate roughly based on progress breakpoints for simplicity

            if (prog < 30) {
                px = chaosX; py = chaosY; pz = chaosZ;
            } else if (prog < 60) {
                // Lerp Chaos -> Ring
                const alpha = (prog - 30) / 30;
                px = THREE.MathUtils.lerp(chaosX, ringX, alpha);
                py = THREE.MathUtils.lerp(chaosY, ringY, alpha);
                pz = THREE.MathUtils.lerp(chaosZ, ringZ, alpha);
            } else {
                // Lerp Ring -> Sphere
                const alpha = Math.min(1, (prog - 60) / 30);
                px = THREE.MathUtils.lerp(ringX, sphereX, alpha);
                py = THREE.MathUtils.lerp(ringY, sphereY, alpha);
                pz = THREE.MathUtils.lerp(ringZ, sphereZ, alpha);
            }

            positions[i * 3] = px;
            positions[i * 3 + 1] = py;
            positions[i * 3 + 2] = pz;
        });

        mesh.current.geometry.attributes.position.needsUpdate = true;
        (mesh.current.material as THREE.PointsMaterial).color = lightColor;
    });

    return (
        <>
            <pointLight ref={lightRef} distance={30} decay={2} />
            <points ref={mesh}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particles.length}
                        array={new Float32Array(count * 3)}
                        itemSize={3}
                        args={[new Float32Array(count * 3), 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.08}
                    transparent
                    opacity={0.8}
                    blending={THREE.AdditiveBlending}
                    sizeAttenuation={true}
                />
            </points>
        </>
    );
}

const NeuralLoom = ({ progress, logs }: { progress: number, logs: string[] }) => {
    // Smoothed progress for UI numbers to avoid jumping
    const [displayProgress, setDisplayProgress] = useState(0);

    useEffect(() => {
        // Quick visual loop to catch up UI number smoothly
        let animationFrame: number;
        const animate = () => {
            setDisplayProgress(prev => {
                const diff = progress - prev;
                if (Math.abs(diff) < 0.5) return progress;
                return prev + diff * 0.1;
            });
            animationFrame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationFrame);
    }, [progress]);

    return (
        <div className="w-full h-screen relative bg-[#030305] overflow-hidden">
            {/* 3D Scene */}
            <Canvas camera={{ position: [0, 0, 18], fov: 50 }} gl={{ antialias: true }}>
                <color attach="background" args={["#030305"]} />
                <fog attach="fog" args={["#030305", 15, 30]} />
                <Stars radius={150} depth={50} count={7000} factor={4} saturation={0} fade speed={0.5} />
                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
                    <ParticleSwarm progress={progress} />
                </Float>
            </Canvas>

            {/* Circular Progress Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="relative w-80 h-80 md:w-96 md:h-96">
                    {/* Rotating Rings */}
                    <div className="absolute inset-0 border border-cyan-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-4 border border-purple-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

                    {/* SVG Progress Circle */}
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="50%" cy="50%" r="48%"
                            className="stroke-cyan-900/20 fill-none stroke-[2]"
                        />
                        <circle
                            cx="50%" cy="50%" r="48%"
                            className="stroke-cyan-400 fill-none stroke-[2] transition-all duration-300 ease-out"
                            strokeDasharray="300%"
                            strokeDashoffset={`${300 - (displayProgress / 100) * 300}%`}
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Central Percent */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-6xl md:text-7xl font-light text-white font-mono tracking-tighter">
                            {Math.round(displayProgress)}%
                        </span>
                        <span className="text-xs text-cyan-400 uppercase tracking-[0.3em] mt-2">
                            Synthesizing
                        </span>
                    </div>
                </div>
            </div>

            {/* Logs - Bottom Left */}
            <div className="absolute bottom-12 left-6 md:left-12 space-y-3 z-20 max-w-md">
                {logs.map((log, i) => (
                    <div
                        key={i}
                        className="text-xs md:text-sm font-mono text-cyan-200/80 flex items-center gap-3"
                        style={{ opacity: 1 - (i * 0.15) }}
                    >
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                        <span className="backdrop-blur-sm bg-black/10 px-2 py-1 rounded">{log}</span>
                    </div>
                ))}
            </div>

            {/* Top Right Status */}
            <div className="absolute top-8 right-8 text-right">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">System Status</div>
                <div className="text-sm font-mono text-cyan-400 flex items-center justify-end gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    ACTIVE
                </div>
            </div>
        </div>
    );
};

export default NeuralLoom;
