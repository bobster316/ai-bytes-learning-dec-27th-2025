"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// --- Atmosphere Shader Material ---
// This creates the "Rim Light" / "Halo" effect around the sphere
const AtmosphereShaderMaterial = {
    uniforms: {
        coef: { value: 0.8 },
        power: { value: 4.0 },
        glowColor: { value: new THREE.Color(0x0066ff) }, // Start Blue
        viewVector: { value: new THREE.Vector3(0, 0, 1) },
        intensity: { value: 1.0 }
    },
    vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform vec3 glowColor;
    uniform float coef;
    uniform float power;
    uniform float intensity;
    varying vec3 vNormal;
    void main() {
      float i = intensity * pow(coef - dot(vNormal, vec3(0.0, 0.0, 1.0)), power);
      gl_FragColor = vec4(glowColor, 1.0) * i;
    }
  `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide // Only render front to get the rim effect correctly from our view
};

function ParticleSphere({ volume, isListening, isSpeaking }: { volume: number; isListening: boolean; isSpeaking: boolean }) {
    const pointsRef = useRef<THREE.Points>(null);
    const atmosphereRef = useRef<THREE.Mesh>(null);
    const coreRef = useRef<THREE.Mesh>(null);

    // Create random point distribution on a sphere surface
    // Increased count for "denser" look
    const particles = useMemo(() => {
        const count = 2000;
        const positions = new Float32Array(count * 3);
        const radius = 2.0;

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            // Tighter containment for a solid look, less jitter
            const r = radius;

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        return positions;
    }, []);

    // Create a larger sphere geometry for the glow
    const glowGeo = useMemo(() => new THREE.SphereGeometry(2.3, 64, 64), []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // Color Transitions
        const targetColor = isListening && isSpeaking
            ? new THREE.Color(0xaa00ff) // Purple when speaking
            : new THREE.Color(0x00A0FF); // Blue when listening/idle

        // Lerp factor
        const lerpSpeed = 0.05;

        if (pointsRef.current) {
            // Rotation
            const baseSpeed = isSpeaking ? 0.5 : 0.2; // Faster when speaking
            const speed = isListening ? baseSpeed + (volume * 0.5) : baseSpeed;
            pointsRef.current.rotation.y += speed * 0.01;

            // Audio Reactivity (Pulse Scale)
            const targetScale = 1 + (volume * (isSpeaking ? 0.8 : 0.3));
            pointsRef.current.scale.x += (targetScale - pointsRef.current.scale.x) * 0.1;
            pointsRef.current.scale.y += (targetScale - pointsRef.current.scale.y) * 0.1;
            pointsRef.current.scale.z += (targetScale - pointsRef.current.scale.z) * 0.1;

            // Paint particles
            // @ts-ignore
            if (pointsRef.current.material.color) {
                // @ts-ignore
                pointsRef.current.material.color.lerp(targetColor, lerpSpeed);
            }
        }

        if (atmosphereRef.current) {
            // Pulse Intensity of Glow
            const breath = Math.sin(time * (isSpeaking ? 4.0 : 2.0)) * 0.2 + 0.8;
            const audioBoost = volume * 2.5;
            const totalIntensity = breath + audioBoost;

            const mat = atmosphereRef.current.material as THREE.ShaderMaterial;
            mat.uniforms.intensity.value = totalIntensity;
            mat.uniforms.viewVector.value = new THREE.Vector3(0, 0, 1);

            // Paint Atmosphere
            // @ts-ignore
            mat.uniforms.glowColor.value.lerp(isSpeaking ? new THREE.Color(0x8800ff) : new THREE.Color(0x0066ff), lerpSpeed);

            atmosphereRef.current.rotation.y -= 0.005;
        }

        if (coreRef.current) {
            coreRef.current.rotation.y += 0.005;
        }
    });

    return (
        <group>
            {/* 1. Black Core Sphere (Occlusion) to create the "Planet" look behind particles */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[1.9, 32, 32]} />
                <meshBasicMaterial color="#000000" />
            </mesh>

            {/* 2. The Particles */}
            <Points ref={pointsRef} positions={particles} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#00A0FF"
                    size={0.06} // Beefier particles
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    opacity={0.9}
                />
            </Points>

            {/* 3. Atmosphere / Glow Shader Mesh */}
            <mesh ref={atmosphereRef} geometry={glowGeo}>
                <shaderMaterial args={[AtmosphereShaderMaterial]} />
            </mesh>


        </group>
    );
}

// --- Ring Shader for Outer Glow ---
const RingShader = {
    uniforms: {
        color: { value: new THREE.Color(0x0022cc) },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform vec3 color;
        void main() {
            // Distance from center 0.5, 0.5
            float dist = distance(vUv, vec2(0.5));
            // Create a ring: Bright at 0.4, black at 0.5 and 0.2
            float ring = smoothstep(0.2, 0.35, dist) * (1.0 - smoothstep(0.35, 0.5, dist));
            gl_FragColor = vec4(color, ring * 0.6); // 0.6 max opacity
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
};

function OuterHalo() {
    return (
        <mesh scale={[8, 8, 1]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial args={[RingShader]} />
        </mesh>
    )
}


export function ParticleGlobe({ isListening, volume, isSpeaking }: { isListening: boolean, volume: number, isSpeaking: boolean }) {
    return (
        <div className="w-full h-full relative">
            <Canvas
                camera={{ position: [0, 0, 11], fov: 40 }}
                gl={{ alpha: true, antialias: true, toneMapping: THREE.NoToneMapping }}
                dpr={[1, 2]}
            >
                {/* 
                   Background: User requested deep blue ethereal background? 
                   Uploaded image 1 has a black background with the blue ring.
                   We'll let the ring do the work.
                */}
                <ambientLight intensity={0.2} />

                <ParticleSphere volume={volume} isListening={isListening || isSpeaking} isSpeaking={isSpeaking} />
                <OuterHalo />
            </Canvas>
        </div>
    );
}
