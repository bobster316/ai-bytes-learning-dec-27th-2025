// SterlingVoice v4 — ElevenLabs Conversational AI Migration
"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { Settings, X, Minimize2, Maximize2, Copy, Check } from "lucide-react";
import { PLAN_DETAILS } from "@/lib/stripe/constants";
import { createClient } from "@/lib/supabase/client";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  teal: "#0abfbc",
  tealDark: "#089a97",
  tealDeeper: "#057a78",
  tealGlow: "rgba(10,191,188,0.18)",
  tealFaint: "rgba(10,191,188,0.07)",
  dark: "#0c0c0e",
  surface: "#111113",
  border: "rgba(255,255,255,0.07)",
  borderBright: "rgba(255,255,255,0.13)",
  white: "#ffffff",
  whiteDim: "rgba(255,255,255,0.75)",
  whiteFaint: "rgba(255,255,255,0.62)",
  red: "#e53e3e",
  redGlow: "rgba(229,62,62,0.3)",
  emerald: "#34d399",
  amber: "#f59e0b",
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
};

type StatusKey = "idle" | "connecting" | "live" | "speaking" | "listening" | "thinking" | "voice";

const STATUS_CFG: Record<StatusKey, { label: string; color: string; dotColor: string; pulse: boolean }> = {
  idle: { label: "Idle", color: "rgba(255,255,255,.28)", dotColor: "rgba(255,255,255,.22)", pulse: false },
  connecting: { label: "Connecting", color: T.teal, dotColor: T.teal, pulse: true },
  live: { label: "Live", color: T.emerald, dotColor: T.emerald, pulse: false },
  speaking: { label: "Sterling speaking", color: T.teal, dotColor: T.teal, pulse: true },
  listening: { label: "Listening", color: T.emerald, dotColor: T.emerald, pulse: false },
  thinking: { label: "Thinking", color: T.amber, dotColor: T.amber, pulse: true },
  voice: { label: "Voice detected", color: T.emerald, dotColor: T.emerald, pulse: true },
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes s-spin    { to { transform: rotate(360deg); } }
  @keyframes s-pulse   { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.75} }
  @keyframes s-wave    { 0%,100%{height:4px} 50%{height:22px} }
  @keyframes s-blink   { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes s-tabpulse{
    0%{transform:scale(.8);opacity:.7} 70%{transform:scale(2.2);opacity:0} 100%{transform:scale(.8);opacity:0}
  }
  @keyframes s-in {
    from{transform:translateX(340px) scale(.94);opacity:0}
    to{transform:translateX(0) scale(1);opacity:1}
  }
  @keyframes s-fadein  { from{opacity:0} to{opacity:1} }
  @keyframes s-breathe {
    0%,100%{box-shadow:0 0 0 0 rgba(10,191,188,0)}
    50%    {box-shadow:0 0 0 5px rgba(10,191,188,.14)}
  }

  .s-bar{border-radius:2px;background:${T.teal};opacity:.18;transition:opacity .3s,height .15s}
  .s-bar.on{opacity:1;animation:s-wave 1.1s ease-in-out infinite}
  .s-bar:nth-child(1){animation-delay:.00s}.s-bar:nth-child(2){animation-delay:.07s}
  .s-bar:nth-child(3){animation-delay:.14s}.s-bar:nth-child(4){animation-delay:.21s}
  .s-bar:nth-child(5){animation-delay:.28s}.s-bar:nth-child(6){animation-delay:.35s}
  .s-bar:nth-child(7){animation-delay:.18s}.s-bar:nth-child(8){animation-delay:.09s}
  .s-bar:nth-child(9){animation-delay:.25s}.s-bar:nth-child(10){animation-delay:.32s}
  .s-bar:nth-child(11){animation-delay:.04s}.s-bar:nth-child(12){animation-delay:.16s}
  .s-bar:nth-child(13){animation-delay:.22s}.s-bar:nth-child(14){animation-delay:.30s}
  .s-bar:nth-child(15){animation-delay:.11s}.s-bar:nth-child(16){animation-delay:.19s}
  .s-bar:nth-child(17){animation-delay:.26s}.s-bar:nth-child(18){animation-delay:.33s}
  .s-bar:nth-child(19){animation-delay:.06s}.s-bar:nth-child(20){animation-delay:.13s}

  .s-dot-pulse{animation:s-pulse .9s ease-in-out infinite}
  .s-cursor{display:inline-block;width:2px;height:11px;background:${T.teal};margin-left:2px;vertical-align:middle;animation:s-blink 1s step-end infinite}

  .s-btn{position:relative;overflow:hidden;cursor:pointer;transition:all .3s cubic-bezier(.23,1,.32,1);font-family:${T.sans};font-weight:600;letter-spacing:.18em;text-transform:uppercase;border:none;}
  .s-btn::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.09),transparent);transition:left .5s ease;}
  .s-btn:hover::before{left:100%}
  .s-btn:hover{transform:translateY(-1px)}
  .s-btn:active{transform:translateY(0)}

  .s-icon{display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s ease;background:rgba(255,255,255,.04);border:1px solid ${T.border};color:${T.whiteDim};border-radius:7px;}
  .s-icon:hover{background:rgba(255,255,255,.09);border-color:${T.borderBright};color:#fff}

  .s-tx-block{border-radius:9px;border:1px solid ${T.border};padding:10px 12px;animation:s-fadein .3s ease;position:relative;}
  .s-tx-block:hover .s-copy-btn{opacity:1}
  .s-copy-btn{position:absolute;top:8px;right:8px;opacity:.85;transition:all .2s;background:rgba(10,191,188,.18);border:1px solid rgba(10,191,188,.45);border-radius:6px;padding:4px 8px;cursor:pointer;color:#fff;font-size:11px;font-family:${T.sans};display:flex;align-items:center;gap:5px;letter-spacing:.04em;}
  .s-copy-btn:hover{background:rgba(10,191,188,.32);border-color:rgba(10,191,188,.7);color:#fff}

  .s-copy-all{cursor:pointer;border:1px solid ${T.border};background:rgba(255,255,255,.04);color:${T.whiteDim};border-radius:7px;padding:6px 10px;font-size:10px;font-family:${T.sans};letter-spacing:.18em;text-transform:uppercase;font-weight:600;transition:all .2s ease;}
  .s-copy-all:hover{background:rgba(255,255,255,.1);border-color:${T.borderBright};color:#fff}

  .s-scroll::-webkit-scrollbar{width:3px}
  .s-scroll::-webkit-scrollbar-track{background:transparent}
  .s-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}

  .s-select{width:100%;border-radius:8px;border:1px solid ${T.border};background:${T.surface};padding:8px 12px;font-size:11px;color:rgba(255,255,255,.75);font-family:${T.sans};outline:none;transition:border .2s;}
  .s-select:focus{border-color:rgba(10,191,188,.4)}
`;

interface TxEntry { role: "sterling" | "user"; text: string; time: string }
function nowTime() { return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }

const WAVE_H = [5, 9, 15, 22, 13, 7, 18, 24, 20, 11, 25, 19, 13, 17, 9, 21, 15, 7, 11, 5];
function WaveBars({ active }: { active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, height: 44 }}>
      {WAVE_H.map((h, i) => <div key={i} className={`s-bar${active ? " on" : ""}`} style={{ width: 3, height: h }} />)}
    </div>
  );
}

function StatusBadge({ sk }: { sk: StatusKey }) {
  const c = STATUS_CFG[sk];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div className={c.pulse ? "s-dot-pulse" : ""} style={{ width: 7, height: 7, borderRadius: "50%", background: c.dotColor, flexShrink: 0, transition: "background .3s" }} />
      <span style={{ fontFamily: T.sans, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: c.color, transition: "color .3s" }}>{c.label}</span>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text).catch(() => { });
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button className="s-copy-btn" onClick={handle}>
      {copied ? <Check size={9} /> : <Copy size={9} />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function CopyAllBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard?.writeText(text).catch(() => { });
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button className="s-copy-all" onClick={handle}>
      {copied ? "Copied" : "Copy All"}
    </button>
  );
}

function TxBlock({ entry }: { entry: TxEntry }) {
  const isSterling = entry.role === "sterling";
  return (
    <div className="s-tx-block" style={{ background: isSterling ? "rgba(10,191,188,.06)" : "rgba(255,255,255,.03)", borderColor: isSterling ? "rgba(10,191,188,.18)" : T.border }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: isSterling ? T.teal : "rgba(255,255,255,.3)" }}>{isSterling ? "Sterling" : "You"}</span>
        <span style={{ fontFamily: T.sans, fontSize: 9, color: "rgba(255,255,255,.18)" }}>{entry.time}</span>
      </div>
      <div style={{ fontFamily: T.sans, fontSize: 12.5, lineHeight: 1.65, color: isSterling ? "rgba(255,255,255,.82)" : "rgba(255,255,255,.58)", paddingRight: 40 }}>
        {entry.text}{isSterling && <span className="s-cursor" />}
      </div>
      <CopyBtn text={entry.text} />
    </div>
  );
}

function Avatar({ speaking }: { speaking: boolean }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: `conic-gradient(from 0deg,transparent 0deg,${T.teal} 80deg,transparent 160deg,${T.tealDark} 240deg,transparent 320deg,${T.teal} 360deg)`, animation: "s-spin 10s linear infinite", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${T.tealFaint} 0%,transparent 55%)` }} />
          <span style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 700, color: T.white, letterSpacing: "0.05em", position: "relative", zIndex: 1 }}>S</span>
        </div>
      </div>
      {speaking && <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `1.5px solid ${T.teal}`, animation: "s-breathe 1.2s ease-in-out infinite", pointerEvents: "none" }} />}
      <div className={speaking ? "s-dot-pulse" : ""} style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: speaking ? T.emerald : T.teal, border: `2px solid ${T.dark}`, transition: "background .3s" }} />
    </div>
  );
}

function SterlingTab({ onClick }: { onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ cursor: "pointer", background: T.dark, border: `1px solid ${T.borderBright}`, borderRight: "none", borderRadius: "12px 0 0 12px", padding: "22px 15px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, boxShadow: `-6px 0 36px rgba(0,0,0,.45)`, position: "relative", overflow: "hidden", userSelect: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: `linear-gradient(180deg,${T.tealFaint},transparent)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg,transparent,${T.teal},transparent)`, borderRadius: "0 2px 2px 0" }} />
      <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700, color: T.white, letterSpacing: "0.05em" }}>S</span>
      <div style={{ width: 1, height: 24, background: `linear-gradient(180deg,transparent,${T.borderBright},transparent)` }} />
      <span style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: T.whiteDim, writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" }}>Sterling</span>
      <div style={{ position: "relative", width: 7, height: 7 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.teal }} />
        <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `1.5px solid ${T.teal}`, animation: "s-tabpulse 2.8s ease-in-out infinite", opacity: 0 }} />
      </div>
    </div>
  );
}

function SterlingVoiceInner() {
  const [showSettings, setShowSettings] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTabCollapsed, setIsTabCollapsed] = useState(true);
  const [txHistory, setTxHistory] = useState<TxEntry[]>([]);
  const txScrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const conversation = useConversation({
    onConnect: () => {
        console.log("Sterling connected via ElevenLabs AI.");
    },
    onDisconnect: () => {
        console.log("Sterling disconnected.");
    },
    onMessage: (msg: any) => {
        if (msg.message) {
            setTxHistory((prev) => [...prev, {
                role: msg.source === 'ai' ? 'sterling' : 'user',
                text: msg.message,
                time: nowTime()
            }]);
        }
    },
    onError: (err: any) => console.error("ElevenLabs error:", err),
  });

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";
  const isSterlingSpeaking = conversation.isSpeaking;

  // Render Visualizer Particles
  const particlesRef = useRef<Array<any>>([]);
  const smoothVolRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    particlesRef.current = [];
    for (let i = 0; i < 400; i++) { const t = Math.random() * Math.PI * 2, p = Math.acos(Math.random() * 2 - 1), r = 45, x = r * Math.sin(p) * Math.cos(t), y = r * Math.sin(p) * Math.sin(t), z = r * Math.cos(p); particlesRef.current.push({ angle: 0, speed: 0, radius: r, alpha: .4 + Math.random() * .6, size: .8 + Math.random() * 1.2, z, ox: x, oy: y, oz: z }); }
  }, []);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const cx = cv.getContext("2d"); if (!cx) return;
    const run = () => {
      const target = isSterlingSpeaking ? 0.9 : isConnected ? 0.2 : 0.1;
      smoothVolRef.current += (target - smoothVolRef.current) * 0.08;
      const v = smoothVolRef.current, { width: w, height: h } = cv, cx2 = w / 2, cy2 = h / 2;
      cx.clearRect(0, 0, w, h);
      const g = cx.createRadialGradient(cx2, cy2, 0, cx2, cy2, 70 + v * 40);
      g.addColorStop(0, `rgba(5,10,80,${.6 + v * .3})`); g.addColorStop(.7, `rgba(10,20,120,${.3 + v * .2})`); g.addColorStop(1, "rgba(0,0,0,0)");
      cx.fillStyle = g; cx.beginPath(); cx.arc(cx2, cy2, 120, 0, Math.PI * 2); cx.fill();
      particlesRef.current.forEach((p: any) => { const e = 1 + (Math.sin(Date.now() * .0015) * .1) + (v * .8), x3 = p.ox * e, y3 = p.oy * e, z3 = p.oz * e, sc = 300 / (300 - z3), x2 = cx2 + x3 * sc, y2 = cy2 + y3 * sc, al = p.alpha * ((z3 + 50) / 100); if (al > 0) { cx.fillStyle = `rgba(${10 + v * 40},${20 + v * 60},${150 + v * 105},${al})`; cx.beginPath(); cx.arc(x2, y2, Math.max(.1, p.size * sc), 0, Math.PI * 2); cx.fill(); } });
      animationFrameRef.current = requestAnimationFrame(run);
    };
    run();
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isConnected, isSterlingSpeaking]);

  useEffect(() => { if (txScrollRef.current) txScrollRef.current.scrollTop = txScrollRef.current.scrollHeight; }, [txHistory]);

  const refreshDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const devs = await navigator.mediaDevices.enumerateDevices();
      stream.getTracks().forEach(track => track.stop()); // Free the microphone lock

      const ai = devs.filter((d) => d.kind === "audioinput");
      setInputDevices(ai);
      if (ai.length > 0) {
        const pref = ai.find((d) => !d.label.toLowerCase().includes("virtual") && !d.label.toLowerCase().includes("mix")) || ai[0];
        setSelectedDeviceId(pref.deviceId);
      }
    } catch (e) {
      console.error("Mic access denied.", e);
    }
  };
  useEffect(() => { refreshDevices(); }, []);

  // Set timeout safety to disconnect session automatically after 10 min
  useEffect(() => {
    if (isConnected) {
      const timeout = setTimeout(() => {
        if (conversation.status === 'connected') conversation.endSession();
      }, 10 * 60 * 1000); // 10 minutes hard cutoff
      return () => clearTimeout(timeout);
    }
  }, [isConnected, conversation.status]);

  // Expose an Open Event for the rest of the application
  useEffect(() => {
      const handleOpen = async () => {
        setIsTabCollapsed(false);
        setIsMinimized(false);
        if (conversation.status !== 'connected' && conversation.status !== 'connecting') {
            try {
                // Fetch auth token from backend to bypass CORS checks
                let currentUserName = "Guest";
                const supabase = createClient();
                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user?.user_metadata?.first_name) {
                    currentUserName = userData.user.user_metadata.first_name;
                } else if (userData?.user?.user_metadata?.full_name) {
                    currentUserName = userData.user.user_metadata.full_name.split(' ')[0];
                } else if (userData?.user?.email?.toLowerCase().includes("rav")) {
                    currentUserName = "Rav";
                }
                
                const res = await fetch(`/api/sterling/token?name=${encodeURIComponent(currentUserName)}`);
                const data = await res.json();
                if (data.signedUrl) {
                    await conversation.startSession({ signedUrl: data.signedUrl });
                }
            } catch (err) {
                console.error("Failed to trigger session from open event", err);
            }
        }
      };
      // Keep support for both event names from the codebase
      window.addEventListener('open-sterling', handleOpen);
      window.addEventListener('sterling-start-interaction', handleOpen);
      return () => {
          window.removeEventListener('open-sterling', handleOpen);
          window.removeEventListener('sterling-start-interaction', handleOpen);
      };
  }, [conversation.status, conversation.startSession]);

  const toggleSession = async () => {
      setShowSettings(false);
      try {
          if (isConnected) {
              await conversation.endSession();
          } else {
              // Fetch a signed token to completely bypass ElevenLabs' dashboard domain allowlist
              const res = await fetch("/api/sterling/token");
              if (!res.ok) throw new Error("Failed to get token");
              const data = await res.json();
              if (data.signedUrl) {
                  await conversation.startSession({ signedUrl: data.signedUrl });
              }
          }
      } catch(e) {
          console.error("Failed to start/end elevenlabs session:", e);
      }
  };

  const statusKey: StatusKey = (() => {
    if (isConnecting) return "connecting";
    if (!isConnected) return "idle";
    if (isSterlingSpeaking) return "speaking";
    return "live";
  })();

  const fullTranscript = txHistory.map((e) => `${e.role === "sterling" ? "Sterling" : "You"} (${e.time}): ${e.text}`).join("\\n");

  const primaryBtn: CSSProperties = { width: "100%", height: 48, border: "none", borderRadius: 9, background: `linear-gradient(135deg,${T.tealDeeper} 0%,${T.teal} 100%)`, color: T.white, fontSize: 11, boxShadow: `0 4px 22px rgba(10,191,188,.3),0 1px 0 rgba(255,255,255,.1) inset` };
  const dangerBtn: CSSProperties = { ...primaryBtn, background: `linear-gradient(135deg,#5c0a14 0%,${T.red} 100%)`, boxShadow: `0 4px 22px ${T.redGlow},0 1px 0 rgba(255,255,255,.08) inset` };
  const disabledBtn: CSSProperties = { ...primaryBtn, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.3)", cursor: "not-allowed", boxShadow: "none" };
  const card: CSSProperties = { width: 326, background: T.dark, border: `1px solid ${T.borderBright}`, borderRadius: 16, overflow: "hidden", boxShadow: `0 40px 90px rgba(0,0,0,.75),0 10px 28px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.03) inset,0 1px 0 rgba(255,255,255,.07) inset`, position: "relative", fontFamily: T.sans };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div style={{ position: "fixed", right: 0, bottom: 0, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        
        {/* COLLAPSED TAB */}
        {isTabCollapsed && (
          <div className="hidden md:block" style={{ position: "fixed", right: 0, top: "50%", transform: "translateY(-50%)", animation: "s-in .55s cubic-bezier(.23,1,.32,1)" }}>
            <SterlingTab onClick={() => setIsTabCollapsed(false)} />
          </div>
        )}

        {/* MINIMISED PILL */}
        {isMinimized && !isTabCollapsed && (
          <div style={{ marginBottom: 28, marginRight: 28, display: "flex", alignItems: "center", gap: 8, borderRadius: 40, border: `1px solid ${T.borderBright}`, background: `${T.dark}f5`, backdropFilter: "blur(16px)", padding: "8px 14px", boxShadow: "0 8px 32px rgba(0,0,0,.55)", animation: "s-in .4s cubic-bezier(.23,1,.32,1)" }}>
            <button onClick={() => setIsMinimized(false)} className="s-icon" style={{ width: 28, height: 28 }}><Maximize2 size={13} /></button>
            <span style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 700, color: T.white, letterSpacing: "0.04em", paddingRight: 4 }}>S</span>
            <div style={{ width: 1, height: 16, background: T.border }} />
            <StatusBadge sk={statusKey} />
            {!isConnected && !isConnecting && <button onClick={toggleSession} className="s-btn" style={{ ...primaryBtn, width: "auto", height: 30, padding: "0 14px", fontSize: 10 }}>Summon</button>}
            {isConnecting && <div style={{ ...disabledBtn, width: "auto", height: 30, padding: "0 14px", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>Connecting…</div>}
            {isConnected && <button onClick={toggleSession} className="s-btn" style={{ ...dangerBtn, width: "auto", height: 30, padding: "0 14px", fontSize: 10 }}>End</button>}
            <button onClick={() => setIsTabCollapsed(true)} className="s-icon" style={{ width: 28, height: 28 }}><X size={12} /></button>
          </div>
        )}

        {/* FULL WIDGET */}
        {!isMinimized && !isTabCollapsed && (
          <div style={{ marginBottom: 28, marginRight: 28, animation: "s-in .6s cubic-bezier(.23,1,.32,1)" }}>
            <div style={card}>

              <div style={{ position: "absolute", top: -50, left: "50%", transform: "translateX(-50%)", width: 160, height: 90, background: `radial-gradient(ellipse,${T.tealGlow} 0%,transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

              {/* HEADER */}
              <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Avatar speaking={isSterlingSpeaking} />
                  <div>
                    <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: T.white, letterSpacing: "0.04em", lineHeight: 1, marginBottom: 5 }}>Sterling</div>
                    <div style={{ fontFamily: T.sans, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: T.teal }}>Personal AI Tutor</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                  <button onClick={() => setShowSettings(p => !p)} className="s-icon" style={{ width: 28, height: 28 }} title="Settings"><Settings size={12} /></button>
                  <button onClick={() => setIsMinimized(true)} className="s-icon" style={{ width: 28, height: 28 }} title="Minimise"><Minimize2 size={12} /></button>
                  <button onClick={() => setIsTabCollapsed(true)} className="s-icon" style={{ width: 28, height: 28 }} title="Collapse to tab"><X size={12} /></button>
                </div>
              </div>

              <div style={{ margin: "16px 20px 0", height: 1, background: `linear-gradient(90deg,transparent,${T.borderBright},transparent)`, position: "relative", zIndex: 1 }} />

              <div style={{ padding: "14px 20px 4px", position: "relative", zIndex: 1 }}>
                <WaveBars active={isSterlingSpeaking} />
              </div>

              <div style={{ margin: "8px 20px 10px", padding: "9px 14px", borderRadius: 9, background: "rgba(255,255,255,.03)", border: `1px solid ${T.border}`, position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <StatusBadge sk={statusKey} />
              </div>

              <div style={{ margin: "0 20px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,.28)" }}>
                  Transcript
                </span>
                <CopyAllBtn text={fullTranscript} />
              </div>
              
              <div
                ref={txScrollRef}
                className="s-scroll"
                style={{ margin: "0 20px 10px", maxHeight: 196, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5, position: "relative", zIndex: 1 }}
              >
                {txHistory.length === 0 && (
                  <div style={{ fontFamily: T.sans, fontSize: 11, color: "rgba(255,255,255,.18)", textAlign: "center", padding: "14px 0", letterSpacing: "0.04em" }}>
                    Transcript will appear here
                  </div>
                )}
                {txHistory.map((entry, i) => <TxBlock key={i} entry={entry} />)}
              </div>

              <div style={{ padding: "2px 20px 18px", position: "relative", zIndex: 1, display: "flex", gap: 8 }}>
                {!isConnected && !isConnecting && <button onClick={toggleSession} className="s-btn" style={primaryBtn}>Summon Sterling</button>}
                {isConnecting && <div style={{ ...disabledBtn, display: "flex", alignItems: "center", justifyContent: "center" }}>Connecting…</div>}
                {isConnected && <button onClick={toggleSession} className="s-btn" style={dangerBtn}>End Session</button>}
              </div>

              {showSettings && (
                <div style={{ margin: "0 20px 18px", borderTop: `1px solid ${T.border}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 8, position: "relative", zIndex: 1 }}>
                  <span style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,.3)" }}>Input Device</span>
                  <select value={selectedDeviceId} onChange={e => setSelectedDeviceId(e.target.value)} className="s-select">
                    {inputDevices.length === 0 && <option value="">No microphone detected</option>}
                    {inputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || "Microphone"}</option>)}
                  </select>
                  <button onClick={refreshDevices} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: T.teal, fontFamily: T.sans, letterSpacing: "0.05em", padding: 0, textAlign: "left" }}>
                    Refresh devices
                  </button>
                </div>
              )}

              <div style={{ padding: "0 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${T.border}`, paddingTop: 10, marginTop: -2, position: "relative", zIndex: 1 }}>
                <span style={{ fontFamily: T.sans, fontSize: 8.5, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: T.whiteFaint }}>AI Bytes · ElevenLabs Conversational</span>
                <canvas ref={canvasRef} width={40} height={40} style={{ borderRadius: 5, opacity: .6 }} />
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function SterlingVoice() {
  return (
    <ConversationProvider>
      <SterlingVoiceInner />
    </ConversationProvider>
  );
}
