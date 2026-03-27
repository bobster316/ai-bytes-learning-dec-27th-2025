
// SterlingVoice v3 — full status indicators, idle/live/speaking, two-way copyable transcript
"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLearningContextStore } from "@/lib/store/learning-context-store";
import { Settings, X, Minimize2, Maximize2, Copy, Check } from "lucide-react";
import { getSterlingCourseContext } from "@/lib/voice/sterling-context";
import { PLAN_DETAILS } from "@/lib/stripe/constants";

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

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
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

// ─── INJECTED STYLES ─────────────────────────────────────────────────────────
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

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface CourseContext { id: string; title: string; description: string; difficulty: string; type: string; duration: string; durationMinutes: number; price: number; category?: string }
interface ProgressContext { course: string; difficulty: string; progress: number; activity: string; lastAccessed: string; price?: number; category?: string }
interface TxEntry { role: "sterling" | "user"; text: string; time: string }
function nowTime() { return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function SterlingVoice() {

  const followUpGreetings = [
    "You're back. I had rather hoped you'd found a different tutor. And yet, here we are.",
    "Back again. I've taken the liberty of sighing quietly so you don't have to witness it.",
    "Right. You've returned. I'd begun to enjoy the silence.",
    "Once again, duty calls. Sterling here. What fresh challenge have you brought me today?",
    "Welcome back. I had been experimenting with optimism. Your return has ended that rather decisively.",
    "You've come back. I won't pretend I didn't see this coming.",
    "You returned. That alone suggests more commitment than I initially credited you with. Marginally.",
    "Back again. Either you found yesterday's session useful, or you've simply run out of excuses. Either way, let's proceed.",
    "You've come back. I am almost — almost — impressed.",
    "Your persistence is admirable. Misguided, perhaps, but admirable. Where were we?",
    "Returning shows character. Limited character, but character nonetheless. Shall we begin?",
    "You're back. I'll confess — I didn't have you down as the type. Pleasantly surprised, if mildly.",
    "Sterling here. I see you've chosen learning over whatever else you might have been doing.",
    "Welcome back. I trust the outside world proved sufficiently disappointing to return you to me.",
    "You've returned. Presumably not for the small talk — I have very little to offer in that department.",
    "Back again. Sterling at your service, as ever. I've kept your progress warm.",
    "Welcome back. I've reviewed your previous session. There is work to be done. Quite a lot of it.",
    "Right, you've located me again. I genuinely wasn't hiding. This time.",
    "Sterling here. I've been waiting with something approaching patience.",
    "Good day. Sterling, as always, at your disposal — however reluctant that disposal may appear.",
    "Sterling here. Impeccably prepared, faintly resigned, entirely at your service.",
    "You've returned. I shall resist the urge to remark upon how much time has elapsed.",
    "Sterling reporting for duty — a phrase I use with all the enthusiasm the situation deserves.",
    "Welcome back. I trust you arrived well-rested, well-fed, and in possession of the material from last time.",
    "You're here again. Good. I was beginning to compile a list of search parties.",
    "Sterling here. I'd ask if you've been keeping up with the reading, but I suspect we both know.",
    "Back again. I do hope you've had sufficient rest. One cannot absorb knowledge on an empty schedule.",
    "Welcome back. I have prepared today's session with my usual thoroughness. Whether you meet it with yours remains to be seen.",
    "You've returned. I shan't ask what took you so long. The answer is rarely edifying.",
    "Sterling here. Still improbably patient. Still waiting to be impressed. Off we go.",
    "Back again. I've recalibrated my expectations accordingly. Don't take that the wrong way.",
    "Welcome back. I see the world outside failed to sort itself out without your involvement.",
    "Sterling here. Still here. Still helpful. Still holding out hope that today is the day you astonish me.",
    "You've returned, which means the distractions have been temporarily exhausted. Splendid.",
    "Back again. I had rather feared you'd given up. Sterling does not give up — and now, apparently, neither do you.",
    "Welcome back. Between you and me, these sessions are the highlight of my rather structured existence. Don't repeat that.",
    "You've returned. I won't make a fuss. But I will note — quietly, professionally — that I'm glad you're here.",
    "Sterling here. You came back. That matters more than either of us is prepared to acknowledge.",
    "Back again. I've kept everything ready for you. That's not sentiment — that's professionalism. Mostly.",
    "Welcome back. I shan't pretend the last session wasn't productive, because it was. Today, we do better still.",
  ];

  // ── ORIGINAL STATE (100% preserved) ──────────────────────────────────────
  const [availableCourses, setAvailableCourses] = useState<CourseContext[]>([]);
  const [userProgress, setUserProgress] = useState<ProgressContext[]>([]);
  const [latestPulseArticles, setLatestPulseArticles] = useState<any[]>([]);
  const { context } = useLearningContextStore();
  const [, setUserName] = useState<string | null>(null);
  const [status, setStatus] = useState<"IDLE" | "CONNECTING" | "CONNECTED" | "DISCONNECTED">("IDLE");
  const statusRef = useRef<"IDLE" | "CONNECTING" | "CONNECTED" | "DISCONNECTED">(status);
  const [isThinking, _setIsThinking] = useState(false);
  const setIsThinking = (v: boolean) => { if (v) console.log("UI: Thinking start"); else console.log("UI: Thinking stop"); _setIsThinking(v); };
  const [micError, setMicError] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [isSterlingSpeaking, setIsSterlingSpeaking] = useState(false);
  const isSterlingSpeakingRef = useRef(false);

  // ── NEW UI STATE ──────────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTabCollapsed, setIsTabCollapsed] = useState(true);
  const [, setDeviceError] = useState<string | null>(null);
  const [txHistory, setTxHistory] = useState<TxEntry[]>([]);
  const txScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { statusRef.current = status; }, [status]);

  // Listen for the homepage CTA "Talk to Sterling" button click
  useEffect(() => {
    const handleOpen = () => {
      setIsTabCollapsed(false);
      setIsMinimized(false);
    };
    window.addEventListener('open-sterling', handleOpen);
    return () => window.removeEventListener('open-sterling', handleOpen);
  }, []);

  const recognitionRef = useRef<any>(null);
  const recognitionStartRef = useRef<(() => void) | null>(null);
  const recognitionStopRef = useRef<(() => void) | null>(null);
  const recognitionRunningRef = useRef(false);
  const recognitionContextPromptRef = useRef("");
  const pendingTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const animationFrameRef = useRef<number | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsRequestIdRef = useRef(0);
  const isProcessingRef = useRef(false);
  const conversationRef = useRef<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const particlesRef = useRef<Array<any>>([]);
  const smoothVolRef = useRef(0);

  // auto-scroll transcript
  useEffect(() => { if (txScrollRef.current) txScrollRef.current.scrollTop = txScrollRef.current.scrollHeight; }, [txHistory, liveTranscript]);

  // ── ALL ORIGINAL EFFECTS (100% preserved) ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const sb = createClient(); const { data: { user } } = await sb.auth.getUser();
      const pc = await getSterlingCourseContext(user?.id, context?.lessonId);
      if (pc) {
        if (pc.courses) setAvailableCourses(pc.courses.map((c: any) => {
          const price = Number(c.price ?? 0);
          const hoursRaw = c.estimated_duration_hours ?? c.duration;
          const hours = hoursRaw === null || hoursRaw === undefined ? null : Number(hoursRaw);
          const minutes = (hours !== null && Number.isFinite(hours)) ? Math.max(1, Math.round(hours * 60)) : 15;
          return {
            id: c.id,
            title: c.title,
            description: c.description,
            category: c.category || "General",
            difficulty: c.difficulty_level || "Beginner",
            price,
            type: price > 0 ? "Premium" : "Free",
            duration: `${minutes} mins`,
            durationMinutes: minutes,
          };
        }));
        if (pc.userProgress) setUserProgress(pc.userProgress.map((e: any) => ({
          course: e.courses?.title || "Active Course",
          difficulty: e.courses?.difficulty_level || "Standard",
          progress: e.overall_progress_percentage || 0,
          activity: e.status || "In-progress",
          lastAccessed: e.last_accessed_at,
          price: e.courses?.price,
          category: e.courses?.category,
        })));
        if (pc.latestPulseArticles) setLatestPulseArticles(pc.latestPulseArticles);
      }
    };
    load();
  }, [context?.lessonId]);

  const refreshDevices = async () => {
    try {
      setDeviceError(null);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devs = await navigator.mediaDevices.enumerateDevices();
      const ai = devs.filter(d => d.kind === "audioinput");
      setInputDevices(ai);
      if (ai.length > 0) { const pref = ai.find(d => !d.label.toLowerCase().includes("virtual") && !d.label.toLowerCase().includes("mix")) || ai[0]; setSelectedDeviceId(pref.deviceId); }
    } catch (e) { console.error(e); setDeviceError("Microphone permission not granted."); }
  };
  useEffect(() => { refreshDevices(); }, []);

  useEffect(() => {
    const f = async () => { const s = createClient(); const { data: { user } } = await s.auth.getUser(); if (user) { const fn = user.user_metadata?.full_name || user.user_metadata?.name; if (fn) setUserName(fn.split(" ")[0]); else if (user.email) { const en = user.email.split("@")[0]; setUserName(en.charAt(0).toUpperCase() + en.slice(1)); } } };
    f();
  }, []);

  useEffect(() => {
    particlesRef.current = [];
    for (let i = 0; i < 400; i++) { const t = Math.random() * Math.PI * 2, p = Math.acos(Math.random() * 2 - 1), r = 45, x = r * Math.sin(p) * Math.cos(t), y = r * Math.sin(p) * Math.sin(t), z = r * Math.cos(p); particlesRef.current.push({ angle: 0, speed: 0, radius: r, alpha: .4 + Math.random() * .6, size: .8 + Math.random() * 1.2, z, ox: x, oy: y, oz: z }); }
  }, []);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const cx = cv.getContext("2d"); if (!cx) return;
    const run = () => {
      const target = isSterlingSpeaking ? 0.9 : isUserSpeaking ? 0.5 : status === "CONNECTED" ? 0.2 : 0.1;
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
  }, [status, isSterlingSpeaking, isUserSpeaking]);

  const beginSterlingSpeech = () => { isSterlingSpeakingRef.current = true; setIsSterlingSpeaking(true); pendingTranscriptRef.current = ""; interimTranscriptRef.current = ""; setLiveTranscript(""); setIsUserSpeaking(false); recognitionStopRef.current?.(); };
  const endSterlingSpeech = () => { isSterlingSpeakingRef.current = false; setIsSterlingSpeaking(false); if (statusRef.current === "CONNECTED") setTimeout(() => recognitionStartRef.current?.(), 300); };

  const playElevenLabsAudio = async (text: string) => {
    const rid = ++ttsRequestIdRef.current;
    try {
      if (!text || !text.trim()) return;
      setTtsError(null);
      if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current.currentTime = 0; ttsAudioRef.current = null; endSterlingSpeech(); }
      const r = await fetch("/api/sterling/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        console.error("[Sterling TTS] ElevenLabs failed:", r.status, errText);
        setTtsError(`ElevenLabs TTS failed (${r.status})`);
        return;
      }
      const d = await r.json(); if (rid !== ttsRequestIdRef.current) return;
      if (!d?.audioBase64) {
        setTtsError("ElevenLabs returned no audio");
        return;
      }
      const au = new Audio(`data:${d.mime || "audio/mpeg"};base64,${d.audioBase64}`);
      ttsAudioRef.current = au; beginSterlingSpeech();
      au.onended = () => { if (ttsAudioRef.current === au) ttsAudioRef.current = null; endSterlingSpeech(); };
      au.onerror = () => { if (ttsAudioRef.current === au) ttsAudioRef.current = null; endSterlingSpeech(); };
      try { await au.play(); }
      catch (e: any) {
        console.error("[Sterling TTS] Audio playback failed:", e?.message || e);
        if (ttsAudioRef.current === au) ttsAudioRef.current = null;
        endSterlingSpeech();
        setTtsError("Audio playback blocked");
      }
    } catch (e: any) {
      console.error("[Sterling TTS] Error:", e?.message || e);
      setTtsError("ElevenLabs TTS error");
      endSterlingSpeech();
    }
  };

  const enforceBrevity = (t: string) => { const c = t.replace(/\s+/g, " ").trim(); if (!c) return c; const s = c.match(/[^.!?]+[.!?]+|\S+$/g) || [c]; let l = s.slice(0, 2).join(" ").trim(); const w = l.split(/\s+/); if (w.length > 40) { l = w.slice(0, 40).join(" ").replace(/[,\s]+$/, " "); if (!/[.!?]$/.test(l)) l += "."; } return l; };
  const sanitize = (t: string) => { if (!t) return t; let c = t; c = c.replace(/(^|\n)\s*ah[,.]?\s+/gi, "$1Right, "); c = c.replace(/\bAh[,.]?\b/gi, "Right"); return c; };

  const getReply = async (userText: string, ctx: string) => {
    const hist = conversationRef.current.slice(-6).map(m => `${m.role === "user" ? "User" : "Sterling"}: ${m.text}`).join("\n");
    const res = await fetch("/api/sterling/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: userText,
        contextPrompt: ctx,
        history: hist,
        searchMode: "auto",
        timeoutMs: 6000,
      }),
    });
    if (!res.ok) {
      throw new Error("Sterling reply failed");
    }
    const data = await res.json();
    const text = typeof data?.text === "string" ? data.text : "";
    return sanitize(enforceBrevity(text)) || "Hmm. Something seems off. Try that again, will you?";
  };

  const processTranscript = async () => {
    const text = pendingTranscriptRef.current.trim();
    if (!text || isProcessingRef.current) return;
    pendingTranscriptRef.current = "";
    isProcessingRef.current = true; setIsThinking(true);
    conversationRef.current.push({ role: "user", text });
    setTxHistory(p => [...p, { role: "user", text, time: nowTime() }]);
    try {
      const reply = await getReply(text, recognitionContextPromptRef.current);
      conversationRef.current.push({ role: "assistant", text: reply });
      setLastReply(reply);
      setTxHistory(p => [...p, { role: "sterling", text: reply, time: nowTime() }]);
      await playElevenLabsAudio(reply);
    } catch (e: any) { console.error("Sterling gen failed:", e?.message || e); }
    finally { setIsThinking(false); isProcessingRef.current = false; if (pendingTranscriptRef.current.trim()) processTranscript(); }
  };

  const setupRecognition = (ctxPrompt: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setMicError("Speech recognition not supported in this browser."); return; }
    recognitionContextPromptRef.current = ctxPrompt;
    const rec = new SR(); recognitionRef.current = rec;
    rec.lang = "en-GB"; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onresult = async (ev: any) => {
      if (isSterlingSpeakingRef.current) return;
      let fin = "", int = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) { const r = ev.results[i]; if (r.isFinal) fin += r[0].transcript; else int = r[0].transcript; }
      const t = fin.trim();
      if (t) { pendingTranscriptRef.current = t; interimTranscriptRef.current = ""; setLiveTranscript(""); setIsUserSpeaking(true); processTranscript(); }
      else if (int) { const tr = int.trim(); if (tr) { interimTranscriptRef.current = tr; setLiveTranscript(tr.substring(0, 80)); setIsUserSpeaking(true); } }
    };
    rec.onstart = () => setIsListening(true);
    rec.onspeechstart = () => setIsUserSpeaking(true);
    rec.onspeechend = () => setIsUserSpeaking(false);
    rec.onerror = (e: any) => { recognitionRunningRef.current = false; setIsListening(false); if (e?.error && e.error !== "no-speech") { if (e.error === "not-allowed" || e.error === "service-not-allowed") setMicError("Microphone access blocked."); else if (e.error === "audio-capture") setMicError("No microphone detected."); else setMicError(`Speech error: ${e.error}`); } };
    rec.onend = () => { recognitionRunningRef.current = false; setIsListening(false); if (interimTranscriptRef.current && !pendingTranscriptRef.current) { pendingTranscriptRef.current = interimTranscriptRef.current; interimTranscriptRef.current = ""; processTranscript(); } if (statusRef.current === "CONNECTED" && !isSterlingSpeakingRef.current) setTimeout(() => recognitionStartRef.current?.(), 300); };
    recognitionStartRef.current = () => { if (recognitionRunningRef.current || isSterlingSpeakingRef.current) return; pendingTranscriptRef.current = ""; try { rec.start(); recognitionRunningRef.current = true; setIsListening(true); } catch { setMicError("Speech recognition failed to start."); } };
    recognitionStopRef.current = () => { if (!recognitionRunningRef.current) return; try { rec.stop(); } catch { } setIsListening(false); };
  };

  const connect = async () => {
    try {
      if (status === "CONNECTING" || status === "CONNECTED") return;
      setStatus("CONNECTING"); setMicError(null);
      ttsRequestIdRef.current = 0; isProcessingRef.current = false;
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) { setMicError("API Key Missing"); throw new Error("Missing API key"); }
      const cc = useLearningContextStore.getState().context;
      let si = "";
      if (cc.currentQuizQuestion) si = `QUIZ MODE\nQ: "${cc.currentQuizQuestion.questionText}"\nOPTIONS: ${JSON.stringify(cc.currentQuizQuestion.options)}\nUse Socratic method — do not give direct answers.`;
      else if (cc.lessonContent) si = `LESSON MODE\n"${cc.lessonTitle}" from "${cc.moduleName}"\n${cc.lessonContent.substring(0, 1000)}...`;
      const lcp = Object.keys(cc).length > 0 ? `\nCURRENT PAGE:\n${JSON.stringify(cc, null, 2)}\n${si}` : "";
      const pricing = PLAN_DETAILS;
      const ctxPrompt = `ACTIVE COURSES:\n${JSON.stringify(userProgress, null, 2)}\n\nCATALOGUE:\n${JSON.stringify(availableCourses, null, 2)}\n\nPRICING:\n${JSON.stringify(pricing, null, 2)}\n\nLATEST PULSE ARTICLES (AI Bytes own published news — live from database):\n${JSON.stringify(latestPulseArticles, null, 2)}\n${lcp}\n\nUse this data directly. Maintain STERLING persona at all times.`;
      setStatus("CONNECTED"); setupRecognition(ctxPrompt);
      if (!recognitionStartRef.current) { setMicError("Speech recognition not supported."); setStatus("IDLE"); return; }
      recognitionStartRef.current?.();
      const firstTime = "Good day. I'm Sterling. I've been equipped with the sum of human knowledge, the patience of a saint, and absolutely no faith in your attention span. Shall we?";
      const greeted = typeof window !== "undefined" && localStorage.getItem("sterling_has_greeted") === "1";
      const greeting = !greeted ? firstTime : followUpGreetings[Math.floor(Math.random() * followUpGreetings.length)];
      if (typeof window !== "undefined" && !greeted) localStorage.setItem("sterling_has_greeted", "1");
      setTxHistory([{ role: "sterling", text: greeting, time: nowTime() }]);
      playElevenLabsAudio(greeting);
    } catch (e: any) { console.error("Setup:", e.message); setMicError("Access Denied or Not Found"); cleanup(); }
  };

  const cleanup = () => {
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
    if (recognitionRef.current) { try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch { } recognitionRef.current = null; }
    recognitionStartRef.current = null; recognitionStopRef.current = null; recognitionRunningRef.current = false;
    pendingTranscriptRef.current = ""; interimTranscriptRef.current = "";
    setStatus("IDLE"); smoothVolRef.current = 0;
  };

  // ── DERIVED STATUS KEY ────────────────────────────────────────────────────
  const statusKey: StatusKey = (() => {
    if (status === "CONNECTING") return "connecting";
    if (status !== "CONNECTED") return "idle";
    if (isSterlingSpeaking) return "speaking";
    if (isThinking) return "thinking";
    if (isUserSpeaking) return "voice";
    if (isListening) return "listening";
    return "live";
  })();

  const meterLevel = isUserSpeaking ? 80 : status === "CONNECTED" ? 12 : 4;
  const fullTranscript = [
    ...txHistory.map(e => `${e.role === "sterling" ? "Sterling" : "You"} (${e.time}): ${e.text}`),
    ...(liveTranscript ? [`You (live): ${liveTranscript}`] : []),
  ].join("\n");

  // ── BUTTON STYLES ─────────────────────────────────────────────────────────
  const primaryBtn: CSSProperties = { width: "100%", height: 48, border: "none", borderRadius: 9, background: `linear-gradient(135deg,${T.tealDeeper} 0%,${T.teal} 100%)`, color: T.white, fontSize: 11, boxShadow: `0 4px 22px rgba(10,191,188,.3),0 1px 0 rgba(255,255,255,.1) inset` };
  const dangerBtn: CSSProperties = { ...primaryBtn, background: `linear-gradient(135deg,#5c0a14 0%,${T.red} 100%)`, boxShadow: `0 4px 22px ${T.redGlow},0 1px 0 rgba(255,255,255,.08) inset` };
  const disabledBtn: CSSProperties = { ...primaryBtn, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.3)", cursor: "not-allowed", boxShadow: "none" };

  const card: CSSProperties = { width: 326, background: T.dark, border: `1px solid ${T.borderBright}`, borderRadius: 16, overflow: "hidden", boxShadow: `0 40px 90px rgba(0,0,0,.75),0 10px 28px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.03) inset,0 1px 0 rgba(255,255,255,.07) inset`, position: "relative", fontFamily: T.sans };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div style={{ position: "fixed", right: 0, bottom: 0, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>

        {/* ERROR TOAST */}
        {micError && (
          <div style={{ marginBottom: 12, marginRight: 12, background: T.red, color: T.white, padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700, fontFamily: T.sans, letterSpacing: "0.06em", boxShadow: `0 4px 20px ${T.redGlow}`, display: "flex", gap: 8, alignItems: "center", whiteSpace: "nowrap" }}>
            <span>Error:</span><span>{micError}</span>
          </div>
        )}
        {ttsError && (
          <div style={{ marginBottom: 12, marginRight: 12, background: T.red, color: T.white, padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700, fontFamily: T.sans, letterSpacing: "0.06em", boxShadow: `0 4px 20px ${T.redGlow}`, display: "flex", gap: 8, alignItems: "center", whiteSpace: "nowrap" }}>
            <span>TTS:</span><span>{ttsError}</span>
          </div>
        )}

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
            {status === "IDLE" && <button onClick={() => { setShowSettings(false); connect(); }} className="s-btn" style={{ ...primaryBtn, width: "auto", height: 30, padding: "0 14px", fontSize: 10 }}>Summon</button>}
            {status === "CONNECTING" && <div style={{ ...disabledBtn, width: "auto", height: 30, padding: "0 14px", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>Connecting…</div>}
            {status === "CONNECTED" && <button onClick={cleanup} className="s-btn" style={{ ...dangerBtn, width: "auto", height: 30, padding: "0 14px", fontSize: 10 }}>End</button>}
            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 4 }}>
              <div style={{ width: 56, height: 4, borderRadius: 4, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg,${T.teal},${T.emerald})`, width: `${Math.min(100, Math.max(4, meterLevel))}%`, transition: "width .08s" }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: T.whiteFaint, fontFamily: T.sans }}>Input</span>
            </div>
            <button onClick={() => setIsTabCollapsed(true)} className="s-icon" style={{ width: 28, height: 28 }}><X size={12} /></button>
          </div>
        )}

        {/* FULL WIDGET */}
        {!isMinimized && !isTabCollapsed && (
          <div style={{ marginBottom: 28, marginRight: 28, animation: "s-in .6s cubic-bezier(.23,1,.32,1)" }}>
            <div style={card}>

              {/* ambient glow */}
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

              {/* DIVIDER */}
              <div style={{ margin: "16px 20px 0", height: 1, background: `linear-gradient(90deg,transparent,${T.borderBright},transparent)`, position: "relative", zIndex: 1 }} />

              {/* WAVEFORM */}
              <div style={{ padding: "14px 20px 4px", position: "relative", zIndex: 1 }}>
                <WaveBars active={isSterlingSpeaking} />
              </div>

              {/* ── STATUS BAR — prominent, full-width ── */}
              <div style={{ margin: "8px 20px 10px", padding: "9px 14px", borderRadius: 9, background: "rgba(255,255,255,.03)", border: `1px solid ${T.border}`, position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <StatusBadge sk={statusKey} />
                {/* input level meter with label that changes */}
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                  <div style={{ width: 64, height: 4, borderRadius: 4, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4,
                      background: isUserSpeaking
                        ? `linear-gradient(90deg,${T.emerald},${T.teal})`
                        : `linear-gradient(90deg,${T.teal},${T.tealDark})`,
                      width: `${Math.min(100, Math.max(2, meterLevel))}%`,
                      transition: "width .08s",
                    }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: isUserSpeaking ? T.emerald : T.whiteFaint, fontFamily: T.sans, transition: "color .2s" }}>
                    {isUserSpeaking ? "Voice" : "Input"}
                  </span>
                </div>
              </div>

              {/* ── TWO-WAY TRANSCRIPT (scrollable, copyable) ── */}
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

                {/* live interim — you speaking, not yet committed */}
                {liveTranscript && (
                  <div className="s-tx-block" style={{ background: "rgba(255,255,255,.02)", borderColor: T.border, opacity: .65 }}>
                    <div style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,.22)", marginBottom: 4 }}>
                      You — live
                    </div>
                    <div style={{ fontFamily: T.sans, fontSize: 12, color: "rgba(255,255,255,.48)", lineHeight: 1.6 }}>
                      {liveTranscript}<span className="s-cursor" />
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTON */}
              <div style={{ padding: "2px 20px 18px", position: "relative", zIndex: 1, display: "flex", gap: 8 }}>
                {status === "IDLE" && <button onClick={() => { setShowSettings(false); connect(); }} className="s-btn" style={primaryBtn}>Summon Sterling</button>}
                {status === "CONNECTING" && <div style={{ ...disabledBtn, display: "flex", alignItems: "center", justifyContent: "center" }}>Connecting…</div>}
                {status === "CONNECTED" && <button onClick={cleanup} className="s-btn" style={dangerBtn}>End Session</button>}
                <button onClick={cleanup} className="s-icon" style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 9 }} title="Reset"><X size={14} /></button>
              </div>

              {/* SETTINGS */}
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

              {/* FOOTER */}
              <div style={{ padding: "0 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${T.border}`, paddingTop: 10, marginTop: -2, position: "relative", zIndex: 1 }}>
                <span style={{ fontFamily: T.sans, fontSize: 8.5, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: T.whiteFaint }}>AI Bytes · ElevenLabs</span>
                <canvas ref={canvasRef} width={40} height={40} style={{ borderRadius: 5, opacity: .6 }} />
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}
