"use client";

import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Design tokens (matches site brand) ──────────────────────────────────────
const LAYER_COLORS = ['#00FFB3', '#4ED8C4', '#9B8FFF', '#FFB347', '#FF6B6B'];
const LAYER_COUNTS = [4, 7, 8, 7, 4];
const LAYER_X = [-5.5, -2.75, 0, 2.75, 5.5];

const PROMPTS = [
  { q: 'Analysing pattern...', a: 'Linear regression: 98% confidence' },
  { q: 'Classifying image...', a: "Object: 'Golden Retriever' (94%)" },
  { q: 'Translating text...', a: "Output: 'Le chat est sur la table'" },
  { q: 'Optimising route...', a: 'Efficiency: +12% distance saved' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface NeuronDef {
  id: string;
  layerIdx: number;
  position: [number, number, number];
  color: string;
  colorObj: THREE.Color;
}

interface ConnectionDef {
  src: NeuronDef;
  tgt: NeuronDef;
}

interface LivePulse {
  id: number;
  src: NeuronDef;
  tgt: NeuronDef;
  progress: number;
  speed: number;
  color: THREE.Color;
}

// ─── Deterministic layout (stable across re-renders) ─────────────────────────
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildNeurons(): NeuronDef[] {
  const rng = seededRng(42);
  const neurons: NeuronDef[] = [];
  LAYER_COUNTS.forEach((count, lIdx) => {
    const totalH = (count - 1) * 0.9;
    for (let i = 0; i < count; i++) {
      neurons.push({
        id: `n_${lIdx}_${i}`,
        layerIdx: lIdx,
        position: [
          LAYER_X[lIdx],
          -totalH / 2 + i * 0.9,
          (rng() - 0.5) * 2.0,
        ],
        color: LAYER_COLORS[lIdx],
        colorObj: new THREE.Color(LAYER_COLORS[lIdx]),
      });
    }
  });
  return neurons;
}

function buildConnections(neurons: NeuronDef[]): ConnectionDef[] {
  const rng = seededRng(137);
  const conns: ConnectionDef[] = [];
  for (let l = 0; l < LAYER_COUNTS.length - 1; l++) {
    const srcs = neurons.filter(n => n.layerIdx === l);
    const tgts = neurons.filter(n => n.layerIdx === l + 1);
    srcs.forEach(src => {
      tgts.forEach(tgt => {
        if (rng() > 0.38) conns.push({ src, tgt });
      });
    });
  }
  return conns;
}

// ─── Scene (fully imperative — no setState in render loop) ───────────────────
const PULSE_POOL_SIZE = 120;

function Scene({ isPlaying }: { isPlaying: boolean }) {
  const neurons = useMemo(buildNeurons, []);
  const connections = useMemo(() => buildConnections(neurons), [neurons]);

  // Direct refs to Three.js objects — mutated imperatively in useFrame
  const coreMeshes = useRef<Record<string, THREE.Mesh>>({});
  const glowMeshes = useRef<Record<string, THREE.Mesh>>({});
  const pointLights = useRef<Record<string, THREE.PointLight>>({});
  const pulseCores = useRef<THREE.Mesh[]>([]);
  const pulseHalos = useRef<THREE.Mesh[]>([]);

  // Simulation state — plain ref, never triggers re-render
  const sim = useRef({
    activations: {} as Record<string, number>,
    pulses: [] as LivePulse[],
    nextId: 0,
    lastSpawn: 0,
  });

  // Seed activations once
  useMemo(() => {
    neurons.forEach(n => { sim.current.activations[n.id] = 0; });
  }, [neurons]);

  useFrame(({ clock }) => {
    if (!isPlaying) return;
    const t = clock.getElapsedTime() * 1000;
    const s = sim.current;

    // Spawn: fire a random input neuron every 200ms
    if (t - s.lastSpawn > 200) {
      const inputs = neurons.filter(n => n.layerIdx === 0);
      const src = inputs[Math.floor(Math.random() * inputs.length)];
      s.activations[src.id] = 1.0;

      connections
        .filter(c => c.src.id === src.id)
        .slice(0, Math.ceil(connections.filter(c => c.src.id === src.id).length * 0.7))
        .forEach(conn => {
          s.pulses.push({
            id: s.nextId++,
            src: conn.src,
            tgt: conn.tgt,
            progress: 0,
            speed: 0.011 + Math.random() * 0.009,
            color: conn.src.colorObj.clone(),
          });
        });
      s.lastSpawn = t;
    }

    // Advance pulses
    const done: number[] = [];
    s.pulses.forEach(p => {
      p.progress += p.speed;
      if (p.progress >= 1) {
        s.activations[p.tgt.id] = 1.0;
        if (p.tgt.layerIdx < LAYER_COUNTS.length - 1) {
          connections
            .filter(c => c.src.id === p.tgt.id)
            .forEach(conn => {
              if (Math.random() > 0.4) {
                s.pulses.push({
                  id: s.nextId++,
                  src: conn.src,
                  tgt: conn.tgt,
                  progress: 0,
                  speed: p.speed,
                  color: conn.src.colorObj.clone(),
                });
              }
            });
        }
        done.push(p.id);
      }
    });
    s.pulses = s.pulses.filter(p => !done.includes(p.id));
    if (s.pulses.length > PULSE_POOL_SIZE) s.pulses = s.pulses.slice(-PULSE_POOL_SIZE);

    // Update neuron meshes
    Object.entries(s.activations).forEach(([id, v]) => {
      const next = v < 0.01 ? 0 : v * 0.92;
      s.activations[id] = next;

      const core = coreMeshes.current[id];
      const glow = glowMeshes.current[id];
      const light = pointLights.current[id];
      if (core) {
        (core.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + next * 4;
        core.scale.setScalar(1 + next * 1.8);
      }
      if (glow) {
        (glow.material as THREE.MeshBasicMaterial).opacity = 0.04 + next * 0.28;
        glow.scale.setScalar(1 + next * 3);
      }
      if (light) light.intensity = next * 3;
    });

    // Update pulse pool
    for (let i = 0; i < PULSE_POOL_SIZE; i++) {
      const core = pulseCores.current[i];
      const halo = pulseHalos.current[i];
      if (!core || !halo) continue;

      if (i < s.pulses.length) {
        const p = s.pulses[i];
        const x = p.src.position[0] + (p.tgt.position[0] - p.src.position[0]) * p.progress;
        const y = p.src.position[1] + (p.tgt.position[1] - p.src.position[1]) * p.progress;
        const z = p.src.position[2] + (p.tgt.position[2] - p.src.position[2]) * p.progress;
        core.position.set(x, y, z);
        halo.position.set(x, y, z);
        (core.material as THREE.MeshBasicMaterial).color = p.color;
        (halo.material as THREE.MeshBasicMaterial).color = p.color;
        core.visible = true;
        halo.visible = true;
      } else {
        core.visible = false;
        halo.visible = false;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.08} />
      <Stars radius={55} depth={60} count={2200} factor={2.5} saturation={0.35} fade speed={0.2} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.4}
        minPolarAngle={Math.PI * 0.33}
        maxPolarAngle={Math.PI * 0.67}
      />

      {/* Connection mesh */}
      {connections.map((conn, i) => (
        <Line
          key={i}
          points={[conn.src.position, conn.tgt.position]}
          color={conn.src.color}
          lineWidth={0.6}
          transparent
          opacity={0.1}
        />
      ))}

      {/* Neurons */}
      {neurons.map(n => (
        <group key={n.id} position={n.position}>
          {/* Core sphere */}
          <mesh ref={el => { if (el) coreMeshes.current[n.id] = el; }}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial
              color={n.colorObj}
              emissive={n.colorObj}
              emissiveIntensity={0.4}
              toneMapped={false}
            />
          </mesh>
          {/* Glow halo */}
          <mesh ref={el => { if (el) glowMeshes.current[n.id] = el; }}>
            <sphereGeometry args={[0.13, 8, 8]} />
            <meshBasicMaterial
              color={n.colorObj}
              transparent
              opacity={0.05}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* Per-neuron point light */}
          <pointLight
            ref={el => { if (el) pointLights.current[n.id] = el; }}
            color={n.color}
            intensity={0}
            distance={2.8}
          />
        </group>
      ))}

      {/* Pre-allocated pulse pool */}
      {Array.from({ length: PULSE_POOL_SIZE }).map((_, i) => (
        <group key={`pulse_${i}`}>
          <mesh ref={el => { if (el) pulseCores.current[i] = el; }} visible={false}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial toneMapped={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh ref={el => { if (el) pulseHalos.current[i] = el; }} visible={false}>
            <sphereGeometry args={[0.24, 8, 8]} />
            <meshBasicMaterial
              transparent
              opacity={0.22}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────
export function NeuralNetworkAnimation3D() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [promptIdx, setPromptIdx] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState<'thinking' | 'result'>('thinking');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Typing effect — React state is fine here (~10 updates/sec max)
  useEffect(() => {
    const target = phase === 'thinking' ? PROMPTS[promptIdx].q : PROMPTS[promptIdx].a;

    if (displayText.length < target.length) {
      timerRef.current = setTimeout(
        () => setDisplayText(target.slice(0, displayText.length + 1)),
        phase === 'thinking' ? 72 : 36,
      );
    } else {
      timerRef.current = setTimeout(() => {
        if (phase === 'thinking') {
          setPhase('result');
          setDisplayText('');
        } else {
          setTimeout(() => {
            setPromptIdx(i => (i + 1) % PROMPTS.length);
            setPhase('thinking');
            setDisplayText('');
          }, 2800);
        }
      }, 650);
    }

    return () => clearTimeout(timerRef.current);
  }, [displayText, phase, promptIdx]);

  return (
    <div className="w-full h-[500px] relative rounded-3xl border border-white/[0.07] overflow-hidden bg-[#04040d] shadow-2xl keep-dark">
      {/* R3F canvas fills the container */}
      <Canvas
        camera={{ position: [0, 0, 13], fov: 52 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene isPlaying={isPlaying} />
        </Suspense>
      </Canvas>

      {/* Prompt chip */}
      <div className={`
        absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none
        inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border backdrop-blur-md
        whitespace-nowrap transition-colors duration-500
        ${phase === 'thinking'
          ? 'bg-black/60 border-[#00FFB3]/30 text-[#00FFB3]'
          : 'bg-[#9B8FFF]/10 border-[#9B8FFF]/40 text-white shadow-[0_0_32px_rgba(155,143,255,0.22)]'}
      `}>
        {phase === 'thinking' && (
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 opacity-70" />
        )}
        <span className="font-mono text-sm tracking-wide">
          {displayText}
          <span className="animate-pulse opacity-70">▊</span>
        </span>
      </div>

      {/* Layer legend */}
      <div className="absolute bottom-5 left-5 z-10 flex flex-col gap-1.5 pointer-events-none">
        {([
          ['#00FFB3', 'Input Layer'],
          ['#9B8FFF', 'Hidden Layers'],
          ['#FF6B6B', 'Output Layer'],
        ] as const).map(([color, label]) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: color, boxShadow: `0 0 5px ${color}80` }}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/35">{label}</span>
          </div>
        ))}
      </div>

      {/* Play / Pause */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-5 right-5 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 border border-white/10 cursor-pointer transition-all duration-200"
        onClick={() => setIsPlaying(v => !v)}
      >
        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </Button>

      {/* Accessibility: hide canvas for reduced-motion users */}
      <style>{`@media (prefers-reduced-motion: reduce) { .nr3d-canvas { display: none; } }`}</style>
    </div>
  );
}
