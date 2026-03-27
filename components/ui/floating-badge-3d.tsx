"use client";

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PresentationControls, Float, Html, Center, Sphere, Torus, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { Brain } from 'lucide-react';

interface FloatingBadge3DProps {
    icon?: any; // any to avoid complex svg prop types
    color?: string; // hex string, e.g., "#06b6d4"
    className?: string;
    intensity?: number; // 0.0 to 1.0
}

// Inner mesh component to handle animation and material
function BadgeMesh({ icon: Icon = Brain, color = "#ffffff", intensity = 1 }: FloatingBadge3DProps) {
    const groupRef = useRef<THREE.Group>(null);
    const outerSphereRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const ring2Ref = useRef<THREE.Mesh>(null);

    // Glow material for the core
    const coreMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: new THREE.Color(color).multiplyScalar(1.5), // Overbright for glow
            transparent: true,
            opacity: 0.8 + (intensity * 0.2), // More intense = more opaque
        });
    }, [color, intensity]);

    // Wireframe material for the outer shell
    const shellMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            wireframe: true,
            transparent: true,
            opacity: 0.15 + (intensity * 0.1),
        });
    }, [color, intensity]);

    // Rings material
    const ringMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.5),
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
    }, [color]);

    // Complex rotation for the holographic effect
    useFrame((state) => {
        const time = state.clock.elapsedTime;
        if (groupRef.current) {
            // Very slow bob/wobble on the whole group
            groupRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;
            groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
        }
        if (outerSphereRef.current) {
            outerSphereRef.current.rotation.y = time * 0.5;
            outerSphereRef.current.rotation.x = time * 0.2;
        }
        if (ringRef.current) {
            ringRef.current.rotation.z = time * 0.8;
            ringRef.current.rotation.x = (Math.PI / 2) + Math.sin(time * 0.5) * 0.2;
        }
        if (ring2Ref.current) {
            ring2Ref.current.rotation.z = -time * 0.6;
            ring2Ref.current.rotation.y = (Math.PI / 3) + Math.cos(time * 0.4) * 0.2;
        }
    });

    // Core size scales with mastery (intensity)
    // Guarantee a minimum size even at 0% mastery so it looks like an inactive node
    const coreScale = 0.4 + (intensity * 0.6);

    return (
        <Float
            speed={2} // Animation speed
            rotationIntensity={0.2} // XYZ rotation intensity
            floatIntensity={1} // Up/down float intensity
            floatingRange={[-0.1, 0.1]} // Range of y-axis values the object will float within
        >
            <group ref={groupRef}>
                {/* Inner Glowing Core */}
                <Sphere args={[coreScale, 32, 32]}>
                    <primitive object={coreMaterial} attach="material" />
                </Sphere>

                {/* Outer Wireframe Shell */}
                <Sphere ref={outerSphereRef} args={[1.5, 16, 16]}>
                    <primitive object={shellMaterial} attach="material" />
                </Sphere>

                {/* Orbital Ring 1 */}
                <Torus ref={ringRef} args={[1.8, 0.02, 16, 100]}>
                    <primitive object={ringMaterial} attach="material" />
                </Torus>

                {/* Orbital Ring 2 (Perpendicular-ish) */}
                <Torus ref={ring2Ref} args={[2.0, 0.015, 16, 100]}>
                    <primitive object={ringMaterial} attach="material" />
                </Torus>

                {/* Embed the React Icon as a 3D transformed HTML element floating in front */}
                <Html center position={[0, 0, 1.8]} occlude="blending" style={{ transition: 'all 0.5s' }}>
                    <div className="flex items-center justify-center select-none pointer-events-none drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                        <Icon className="w-12 h-12 text-white" strokeWidth={2} />
                    </div>
                </Html>
            </group>

            {/* High-fidelity glowing aura behind/around the badge */}
            <mesh position={[0, 0, -0.5]}>
                <planeGeometry args={[4, 4]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.15 * intensity}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </Float>
    );
}

// Main wrapping component
export function FloatingBadge3D({ icon, color = "#06b6d4", className, intensity = 1 }: FloatingBadge3DProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={cn("relative w-full h-full cursor-grab active:cursor-grabbing", className)}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <Canvas
                shadows
                camera={{ position: [0, 0, 5], fov: 45 }}
                gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
            >
                {/* Ambient & Directional Lighting for realism */}
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} intensity={1.5} angle={0.2} penumbra={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color={color} />

                {/* Environment Map for stunning metallic reflections */}
                <Environment preset="city" />

                {/* Additive blend glow for the background */}
                <mesh position={[0, 0, -2]}>
                    <planeGeometry args={[8, 8]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.1 * intensity}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>

                {/* Presentation Controls allow the user to drag and spin the 3D object */}
                <PresentationControls
                    global={false} // Spin only when dragging the object
                    cursor={true}
                    snap={true} // Snap back to center when released
                    speed={2} // Drag speed
                    zoom={hovered ? 1.2 : 1} // Pop on hover
                    rotation={[0, 0, 0]}
                    polar={[-Math.PI / 2, Math.PI / 2]} // Vertical limits
                    azimuth={[-Math.PI, Math.PI]} // Horizontal limits
                >
                    <Center>
                        <BadgeMesh icon={icon} color={color} intensity={intensity} />
                    </Center>
                </PresentationControls>

            </Canvas>
        </div>
    );
}
