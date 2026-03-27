
import React, { useState } from 'react';
import { Play, RotateCcw, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CodePlaygroundProps {
    initialCode: string;
    language?: string;
    title?: string;
    description?: string;
    onExecute?: (code: string) => Promise<{ stdout: string[]; stderr: string[]; error?: string }>;
}

export const CodePlayground: React.FC<CodePlaygroundProps> = ({
    initialCode,
    language = 'python',
    title = 'Interactive AI Lab',
    description = 'Modify the code below and run it to see the AI in action.',
    onExecute
}) => {
    const [code, setCode] = useState(initialCode);
    const [output, setOutput] = useState<{ stdout: string[]; stderr: string[]; error?: string } | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleRun = async () => {
        if (!onExecute) return;
        setIsExecuting(true);
        try {
            const result = await onExecute(code);
            setOutput(result);
        } catch (err: any) {
            setOutput({ stdout: [], stderr: [err.message || 'Execution failed'] });
        } finally {
            setIsExecuting(false);
        }
    };

    const handleReset = () => {
        setCode(initialCode);
        setOutput(null);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-12 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900 shadow-2xl">
            {/* Header */}
            <div className="px-8 py-6 bg-slate-800/50 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400">
                        <Terminal size={18} />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm tracking-tight">{title}</h4>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest">{language} environment</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                        title="Copy Code"
                    >
                        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                        title="Reset Code"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Description */}
            {description && (
                <div className="px-8 py-4 bg-violet-500/5 border-b border-white/5">
                    <p className="text-slate-300 text-sm font-light leading-relaxed">{description}</p>
                </div>
            )}

            {/* Editor & Output Split */}
            <div className={onExecute ? "grid lg:grid-cols-2 min-h-[400px]" : "min-h-[300px]"}>
                {/* Code Editor */}
                <div className={`relative ${onExecute ? "border-r border-white/5 bg-slate-900/50" : "bg-slate-900/50"}`}>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck={false}
                        className="w-full h-full p-8 bg-transparent text-slate-300 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 selection:bg-violet-500/30"
                    />

                    {/* ONLY SHOW RUN BUTTON IF EXECUTABLE */}
                    {onExecute && (
                        <div className="absolute bottom-6 right-6">
                            <button
                                onClick={handleRun}
                                disabled={isExecuting}
                                className={`
                    px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all
                    ${isExecuting
                                        ? 'bg-slate-700 text-white/50 cursor-not-allowed'
                                        : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg active:scale-95 shadow-violet-500/20'}
                `}
                            >
                                {isExecuting ? (
                                    <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Play size={16} fill="currentColor" />
                                )}
                                {isExecuting ? 'Running...' : 'Run Lab'}
                            </button>
                        </div>
                    )}
                </div>

                {/* ONLY SHOW OUTPUT CONSOLE IF EXECUTABLE */}
                {onExecute && (
                    <div className="bg-black/40 flex flex-col">
                        <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Output Console</span>
                            {output && <span className="text-[9px] text-emerald-400 font-mono opacity-60">Success • {new Date().toLocaleTimeString()}</span>}
                        </div>
                        <div className="flex-1 p-8 font-mono text-xs overflow-auto">
                            <AnimatePresence mode="wait">
                                {!output && !isExecuting && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full flex flex-col items-center justify-center text-white/10 text-center gap-4"
                                    >
                                        <Terminal size={40} strokeWidth={1} />
                                        <p>Click "Run Lab" to execute your code<br />and see the results here.</p>
                                    </motion.div>
                                )}

                                {isExecuting && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-2"
                                    >
                                        <div className="h-2 w-24 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-violet-500"
                                                animate={{ x: [-100, 100] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            />
                                        </div>
                                        <p className="text-white/30 animate-pulse italic">Initializing secure sandbox...</p>
                                    </motion.div>
                                )}

                                {output && !isExecuting && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-4"
                                    >
                                        {output.stdout.map((line, i) => (
                                            <div key={i} className="text-slate-300 flex gap-4">
                                                <span className="text-white/10 select-none">{i + 1}</span>
                                                <span>{line}</span>
                                            </div>
                                        ))}
                                        {output.stderr.map((line, i) => (
                                            <div key={i} className="text-rose-400 flex gap-4">
                                                <span className="text-white/10 select-none">!</span>
                                                <span>{line}</span>
                                            </div>
                                        ))}
                                        {output.error && (
                                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px]">
                                                <span className="font-bold underline mb-1 block">CRITICAL ERROR</span>
                                                {output.error}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Meta */}
            <div className="px-8 py-4 bg-slate-800/30 border-t border-white/5 flex items-center gap-4 text-[10px] text-white/20 italic">
                {onExecute ? (
                    <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/50 shadow-sm shadow-emerald-500/20" />
                        <span>E2B Sandbox Operational</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500/50 shadow-sm shadow-blue-500/20" />
                        <span>Read-Only Mode</span>
                    </div>
                )}
                <span>•</span>
                <span>Python 3.11</span>
                <span>•</span>
                <span>AI Analytics Enabled</span>
            </div>
        </div>
    );
};
